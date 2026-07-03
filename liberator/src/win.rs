use core::ffi::c_void;
use std::mem::{size_of, zeroed};

use windows_sys::Win32::Foundation::{CloseHandle, HANDLE, INVALID_HANDLE_VALUE};
use windows_sys::Win32::Networking::WinSock::{
    accept, bind, closesocket, getsockname, htonl, listen, ntohs, recv, select, send, socket,
    WSAStartup, FD_SET, IN_ADDR, IN_ADDR_0, INVALID_SOCKET, SOCKADDR, SOCKADDR_IN, SOCKET, TIMEVAL,
    WSADATA,
};
use windows_sys::Win32::System::Diagnostics::Debug::{ReadProcessMemory, WriteProcessMemory};
use windows_sys::Win32::System::Diagnostics::ToolHelp::{
    CreateToolhelp32Snapshot, Module32First, Process32First, Process32Next, MODULEENTRY32,
    PROCESSENTRY32, TH32CS_SNAPMODULE, TH32CS_SNAPMODULE32, TH32CS_SNAPPROCESS,
};
use windows_sys::Win32::System::LibraryLoader::{GetModuleHandleA, GetProcAddress};
use windows_sys::Win32::System::Memory::{
    CreateFileMappingW, MapViewOfFile, UnmapViewOfFile, VirtualAllocEx, VirtualFreeEx,
    VirtualProtectEx, FILE_MAP_WRITE, MEM_COMMIT, MEM_RELEASE, MEM_RESERVE, PAGE_EXECUTE_READWRITE,
    PAGE_READONLY, PAGE_READWRITE,
};
use windows_sys::Win32::System::SystemInformation::GetTickCount;
use windows_sys::Win32::System::Threading::{
    CreateRemoteThread, GetExitCodeThread, OpenProcess, Sleep, WaitForSingleObject,
    LPTHREAD_START_ROUTINE, PROCESS_CREATE_THREAD, PROCESS_QUERY_INFORMATION, PROCESS_VM_OPERATION,
    PROCESS_VM_READ, PROCESS_VM_WRITE,
};

use crate::descramble::{
    decode_offset, read_scrambled_bool_addr, write_nops_addr, write_scrambled_ints_addr,
    write_scrambled_ints_byte,
};
use crate::gen::*;
use crate::mapbuild::engine_map_build;

fn cstr_eq_ignore_case(raw: &[i8], name: &str) -> bool {
    let nb = name.as_bytes();
    let mut i = 0;
    while i < raw.len() && raw[i] != 0 {
        if i >= nb.len() {
            return false;
        }
        if (raw[i] as u8).to_ascii_lowercase() != nb[i].to_ascii_lowercase() {
            return false;
        }
        i += 1;
    }
    i == nb.len()
}

fn find_pid_by_name(name: &str) -> u32 {
    unsafe {
        let snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if snap == INVALID_HANDLE_VALUE {
            return 0;
        }
        let mut pe: PROCESSENTRY32 = zeroed();
        pe.dwSize = size_of::<PROCESSENTRY32>() as u32;
        let mut pid = 0u32;
        if Process32First(snap, &mut pe) != 0 {
            loop {
                if cstr_eq_ignore_case(&pe.szExeFile, name) {
                    pid = pe.th32ProcessID;
                    break;
                }
                if Process32Next(snap, &mut pe) == 0 {
                    break;
                }
            }
        }
        CloseHandle(snap);
        pid
    }
}

fn module_info(pid: u32) -> Option<(u64, u32)> {
    unsafe {
        let snap = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, pid);
        if snap == INVALID_HANDLE_VALUE {
            return None;
        }
        let mut me: MODULEENTRY32 = zeroed();
        me.dwSize = size_of::<MODULEENTRY32>() as u32;
        let mut out = None;
        if Module32First(snap, &mut me) != 0 {
            out = Some((me.modBaseAddr as u64, me.modBaseSize));
        }
        CloseHandle(snap);
        out
    }
}

pub struct Engine {
    pub proc: HANDLE,
    pub base: u64,
    pub modsize: u32,
    pub target: Option<String>,
}

impl Engine {
    pub fn new() -> Self {
        Engine {
            proc: core::ptr::null_mut(),
            base: 0,
            modsize: 0,
            target: std::env::var("RUNNER_TARGET").ok().filter(|s| !s.is_empty()),
        }
    }

    pub fn attach(&mut self) -> bool {
        let defaults = ["RainbowSix.exe", "RainbowSixGame.exe"];
        let names: Vec<&str> = match &self.target {
            Some(t) => vec![t.as_str()],
            None => defaults.to_vec(),
        };
        for name in names {
            let pid = find_pid_by_name(name);
            if pid == 0 {
                continue;
            }
            let h = unsafe {
                OpenProcess(
                    PROCESS_QUERY_INFORMATION
                        | PROCESS_VM_READ
                        | PROCESS_VM_WRITE
                        | PROCESS_VM_OPERATION
                        | PROCESS_CREATE_THREAD,
                    0,
                    pid,
                )
            };
            if h.is_null() {
                return false;
            }
            match module_info(pid) {
                Some((base, size)) => {
                    self.proc = h;
                    self.base = base;
                    self.modsize = size;
                    return true;
                }
                None => {
                    unsafe { CloseHandle(h) };
                    return false;
                }
            }
        }
        false
    }

    pub fn read_mem(&self, addr: u64, buf: &mut [u8]) -> usize {
        let mut got: usize = 0;
        unsafe {
            ReadProcessMemory(
                self.proc,
                addr as usize as *const c_void,
                buf.as_mut_ptr() as *mut c_void,
                buf.len(),
                &mut got,
            );
        }
        got
    }

    pub fn write_mem(&self, addr: u64, bytes: &[u8]) -> bool {
        let mut wr: usize = 0;
        let ok = unsafe {
            WriteProcessMemory(
                self.proc,
                addr as usize as *const c_void,
                bytes.as_ptr() as *const c_void,
                bytes.len(),
                &mut wr,
            )
        };
        ok != 0 && wr == bytes.len()
    }

    pub fn read8(&self, addr: u64) -> u64 {
        let mut b = [0u8; 8];
        self.read_mem(addr, &mut b);
        u64::from_le_bytes(b)
    }

    pub fn rd_real(&self, addr: u64, buf: &mut [u8]) {
        for x in buf.iter_mut() {
            *x = 0;
        }
        self.read_mem(addr, buf);
    }

    pub fn detect_build(&self) -> Option<String> {
        const CHUNK: u32 = 1 << 20;
        const OVERLAP: u32 = 128;
        let mut buf = vec![0u8; (CHUNK + OVERLAP) as usize];
        let mut off: u32 = 0;
        while off < self.modsize {
            let remain = self.modsize - off;
            let toread = remain.min(CHUNK + OVERLAP);
            let got = self.read_mem(self.base + off as u64, &mut buf[..toread as usize]);
            if got > 0 {
                if let Some(m) = crate::buildscan::scan_build(&buf[..got]) {
                    return Some(m);
                }
            }
            off += CHUNK;
        }
        None
    }

    pub fn find_chain(&self, feature: &str, build: &str) -> Option<&'static FeatureChain> {
        FEATURE_CHAINS
            .iter()
            .find(|fc| fc.feature == feature && fc.build == build)
    }

    pub fn resolve_chain_live(&self, fc: &FeatureChain) -> u64 {
        let mut num = self.base + decode_offset(fc.base_offset as i32);
        let mut ptr = self.read8(num);
        let noff = fc.offsets.len();
        for i in 0..noff - 1 {
            num = ptr.wrapping_add(decode_offset(fc.offsets[i]));
            ptr = self.read8(num);
        }
        ptr.wrapping_add(decode_offset(fc.offsets[noff - 1]))
    }
}

struct Patch {
    feature: String,
    kind: String,
    abs: u64,
    bytes: Vec<u8>,
}

fn parse_csv_ints(s: &str) -> Vec<i64> {
    let mut out = Vec::new();
    for f in s.split(',') {
        let t = f.trim_start();
        let b = t.as_bytes();
        let mut i = 0;
        if i < b.len() && (b[i] == b'-' || b[i] == b'+') {
            i += 1;
        }
        let d0 = i;
        while i < b.len() && b[i].is_ascii_digit() {
            i += 1;
        }
        if i > d0 {
            if let Ok(v) = t[..i].parse::<i64>() {
                out.push(v);
            }
        }
    }
    out
}

fn patch_matches(build: &str, feat: &str, pbuild: &str, pbranch: &str, pfeat: &str) -> bool {
    if pbuild != build {
        return false;
    }
    if pbranch != "enable" && pbranch != "always" {
        return false;
    }
    if feat != "all" && feat != pfeat {
        return false;
    }
    true
}

fn build_patch(line: &str, build: &str, feat: &str, modbase: u64) -> Option<Patch> {
    let mut it = line.split(' ').filter(|s| !s.is_empty());
    let kind = it.next()?;
    let feature = it.next()?;
    let pbuild = it.next()?;
    let branch = it.next()?;
    let addr_s = it.next()?;
    let rel_s = it.next()?;
    if !patch_matches(build, feat, pbuild, branch, feature) {
        return None;
    }
    let addr: u64 = addr_s.parse().ok()?;
    let rel = rel_s.parse::<i64>().unwrap_or(0) != 0;
    let mut bytes: Vec<u8> = Vec::new();
    let abs;
    if kind == "SI" {
        let vals = it.next().unwrap_or("");
        abs = write_scrambled_ints_addr(addr, rel, modbase);
        for v in parse_csv_ints(vals) {
            if bytes.len() >= 64 {
                break;
            }
            bytes.push(write_scrambled_ints_byte(v as i32));
        }
    } else {
        let count = it.next().and_then(|s| s.parse::<i32>().ok()).unwrap_or(0);
        let usenop = it.next().and_then(|s| s.parse::<i32>().ok()).unwrap_or(0);
        abs = write_nops_addr(addr, rel, modbase);
        for _ in 0..count {
            if bytes.len() >= 64 {
                break;
            }
            bytes.push(if usenop != 0 { 0x90 } else { 0x00 });
        }
    }
    Some(Patch {
        feature: feature.to_string(),
        kind: kind.to_string(),
        abs,
        bytes,
    })
}

fn hex(bytes: &[u8]) -> String {
    let mut s = String::new();
    for b in bytes {
        s.push_str(&format!("{:02x}", b));
    }
    s
}

fn iterate_patches(eng: &Engine, build: &str, feat: &str, modbase: u64, apply: bool) -> i32 {
    let mut n = 0;
    for line in PATCHES_DATA.split('\n') {
        if line.is_empty() {
            continue;
        }
        if let Some(p) = build_patch(line, build, feat, modbase) {
            let mut ok = true;
            if apply {
                ok = eng.write_mem(p.abs, &p.bytes);
            }
            let suffix = if apply {
                if ok {
                    ",\"written\":true"
                } else {
                    ",\"written\":false"
                }
            } else {
                ""
            };
            println!(
                "{{\"feature\":\"{}\",\"kind\":\"{}\",\"addr\":\"0x{:x}\",\"bytes\":\"{}\"{}}}",
                p.feature,
                p.kind,
                p.abs,
                hex(&p.bytes),
                suffix
            );
            n += 1;
        }
    }
    n
}

fn read_zero(h: HANDLE, addr: u64, buf: &mut [u8]) {
    for x in buf.iter_mut() {
        *x = 0;
    }
    let mut got: usize = 0;
    unsafe {
        ReadProcessMemory(
            h,
            addr as usize as *const c_void,
            buf.as_mut_ptr() as *mut c_void,
            buf.len(),
            &mut got,
        );
    }
}

fn lead_i64(s: &str) -> i64 {
    let t = s.trim_start();
    let b = t.as_bytes();
    let mut i = 0;
    if i < b.len() && (b[i] == b'-' || b[i] == b'+') {
        i += 1;
    }
    while i < b.len() && b[i].is_ascii_digit() {
        i += 1;
    }
    t[..i].parse::<i64>().unwrap_or(0)
}

fn shadow_regions_for_build(build: &str) -> Option<&'static [ShadowRegion]> {
    let prefix = match build.find('_') {
        Some(i) => &build[..i],
        None => build,
    };
    for ms in SHADOW_SEASONS {
        if ms.season.starts_with(prefix) && ms.season.as_bytes().get(prefix.len()) == Some(&b'_') {
            return Some(ms.regions);
        }
    }
    None
}

impl Engine {
    fn read1(&self, addr: u64) -> i32 {
        let mut b = [0u8; 1];
        self.read_mem(addr, &mut b);
        b[0] as i32
    }

    fn write_int64(&self, addr: u64, val: i64) {
        self.write_mem(addr, &val.to_le_bytes());
    }

    fn resolve_ptr_chain(&self, base_offset: u64, offsets: &[i32]) -> u64 {
        let h = self.proc;
        let mut rd = |a: u64, b: &mut [u8]| read_zero(h, a, b);
        let mut num = self.base + decode_offset(base_offset as i32);
        let mut ptr = crate::memread::mr_u64(&mut rd, num);
        let n = offsets.len();
        for i in 0..n - 1 {
            num = ptr.wrapping_add(decode_offset(offsets[i]));
            ptr = crate::memread::mr_u64(&mut rd, num);
        }
        ptr.wrapping_add(decode_offset(offsets[n - 1]))
    }

    fn get_text_section(&self) -> Option<(u64, u32)> {
        let mut dos = [0u8; 64];
        if self.read_mem(self.base, &mut dos) < 64 {
            return None;
        }
        let lfanew = u32::from_le_bytes([dos[60], dos[61], dos[62], dos[63]]) as u64;
        let mut hdr = [0u8; 24];
        if self.read_mem(self.base + lfanew, &mut hdr) < 24 {
            return None;
        }
        let num_sections = u16::from_le_bytes([hdr[6], hdr[7]]);
        let opt_size = u16::from_le_bytes([hdr[20], hdr[21]]) as u64;
        let sec_table = self.base + lfanew + 24 + opt_size;
        for i in 0..num_sections as u64 {
            let mut sec = [0u8; 40];
            if self.read_mem(sec_table + i * 40, &mut sec) < 40 {
                return None;
            }
            if &sec[0..5] == b".text" && sec[5] == 0 {
                let text_size = u32::from_le_bytes([sec[8], sec[9], sec[10], sec[11]]);
                let text_base =
                    self.base + u32::from_le_bytes([sec[12], sec[13], sec[14], sec[15]]) as u64;
                return Some((text_base, text_size));
            }
        }
        None
    }

    fn allocate_near(&self, near_addr: u64, size: u32) -> u64 {
        let base = near_addr & !0xFFFFu64;
        let mut d = 0x10000u64;
        while d < 0x40000000 {
            if base > d {
                let p = unsafe {
                    VirtualAllocEx(
                        self.proc,
                        (base - d) as usize as *const c_void,
                        size as usize,
                        MEM_COMMIT | MEM_RESERVE,
                        PAGE_EXECUTE_READWRITE,
                    )
                };
                if !p.is_null() {
                    return p as u64;
                }
            }
            let p2 = unsafe {
                VirtualAllocEx(
                    self.proc,
                    (base + d) as usize as *const c_void,
                    size as usize,
                    MEM_COMMIT | MEM_RESERVE,
                    PAGE_EXECUTE_READWRITE,
                )
            };
            if !p2.is_null() {
                return p2 as u64;
            }
            d += 0x10000;
        }
        unsafe {
            VirtualAllocEx(
                self.proc,
                core::ptr::null(),
                size as usize,
                MEM_COMMIT | MEM_RESERVE,
                PAGE_EXECUTE_READWRITE,
            ) as u64
        }
    }

    fn inject_library(&self, path: &str) -> bool {
        let wpath: Vec<u16> = path.encode_utf16().chain(std::iter::once(0)).collect();
        let bytes = wpath.len() * 2;
        let rem = unsafe {
            VirtualAllocEx(
                self.proc,
                core::ptr::null(),
                bytes,
                MEM_COMMIT | MEM_RESERVE,
                PAGE_READWRITE,
            )
        };
        if rem.is_null() {
            return false;
        }
        let mut ok = false;
        let mut wr: usize = 0;
        let wrote = unsafe {
            WriteProcessMemory(
                self.proc,
                rem,
                wpath.as_ptr() as *const c_void,
                bytes,
                &mut wr,
            )
        };
        if wrote != 0 {
            let kernel = unsafe { GetModuleHandleA(b"kernel32.dll\0".as_ptr()) };
            let ll = unsafe { GetProcAddress(kernel, b"LoadLibraryW\0".as_ptr()) };
            let start: LPTHREAD_START_ROUTINE = unsafe { std::mem::transmute(ll) };
            let th = unsafe {
                CreateRemoteThread(
                    self.proc,
                    core::ptr::null(),
                    0,
                    start,
                    rem as *const c_void,
                    0,
                    core::ptr::null_mut(),
                )
            };
            if !th.is_null() {
                unsafe { WaitForSingleObject(th, 10000) };
                let mut ret: u32 = 0;
                unsafe { GetExitCodeThread(th, &mut ret) };
                ok = ret != 0;
                unsafe { CloseHandle(th) };
            }
        }
        unsafe { VirtualFreeEx(self.proc, rem, 0, MEM_RELEASE) };
        ok
    }

    fn shadow_dll_path(&self) -> Option<String> {
        if let Ok(env) = std::env::var("RUNNER_SHADOW_DLL") {
            if !env.is_empty() {
                return Some(env);
            }
        }
        let exe = std::env::current_exe().ok()?;
        let dir = exe.parent()?;
        Some(dir.join("Shadow.dll").to_string_lossy().into_owned())
    }

    fn shadow_arm_pages(&self, regions: &[ShadowRegion]) -> i32 {
        let mut armed = 0;
        let mut last_page = 0u64;
        for r in regions {
            let pa = (self.base + r.offset) & !0xFFFu64;
            if pa == last_page {
                continue;
            }
            last_page = pa;
            let mut old: u32 = 0;
            let ok = unsafe {
                VirtualProtectEx(
                    self.proc,
                    pa as usize as *const c_void,
                    0x1000,
                    PAGE_READONLY,
                    &mut old,
                )
            };
            if ok != 0 {
                armed += 1;
            }
        }
        armed
    }

    fn run_shadow(&self, build: &str, dry: bool, arm: bool) -> i32 {
        let (text_base, text_size) = match self.get_text_section() {
            Some(x) => x,
            None => {
                println!("{{\"error\":\"no .text section\"}}");
                return 1;
            }
        };
        let mod_hi = self.base + self.modsize as u64;
        let regions = shadow_regions_for_build(build);
        let region_count = regions.map(|r| r.len()).unwrap_or(0);

        if dry {
            println!("{{\"mode\":\"shadow-scan\",\"build\":\"{}\",\"textBase\":\"0x{:x}\",\"textSize\":{},\"regions\":{}}}",
                build, text_base, text_size, region_count);
            return 0;
        }
        if region_count == 0 {
            println!(
                "{{\"error\":\"no shadow regions for build\",\"build\":\"{}\"}}",
                build
            );
            return 1;
        }
        let regions = regions.unwrap();

        let mut windows: Vec<(u64, u64)> = Vec::new();
        for r in regions {
            let page = (self.base + r.offset) & !0xFFFu64;
            windows.push((page - 0x1000, page + 0x2000));
        }
        windows.sort_by(|a, b| a.0.cmp(&b.0));
        let mut merged: Vec<(u64, u64)> = Vec::new();
        for w in windows {
            if let Some(last) = merged.last_mut() {
                if w.0 <= last.1 {
                    if w.1 > last.1 {
                        last.1 = w.1;
                    }
                    continue;
                }
            }
            merged.push(w);
        }

        let mut entries: Vec<[u8; 24]> = Vec::new();
        let mut total_fix = 0usize;
        for (win_base, win_hi) in merged {
            let win_size = (win_hi - win_base) as usize;
            let mut buf = vec![0u8; win_size];
            let mut filled = 0usize;
            while filled < win_size {
                let got = self.read_mem(win_base + filled as u64, &mut buf[filled..]);
                if got == 0 {
                    break;
                }
                filled += got;
            }
            if filled != win_size {
                continue;
            }
            for r in regions {
                let addr = self.base + r.offset;
                if addr >= win_base && addr + r.patch.len() as u64 <= win_hi {
                    let o = (addr - win_base) as usize;
                    buf[o..o + r.patch.len()].copy_from_slice(r.patch);
                }
            }
            let mut branch_fix: Vec<i32> = Vec::new();
            let maxfix = win_size / 4 + 16;
            let fix = crate::scanrip::scan_rip_rel(
                &buf,
                win_base,
                self.base,
                mod_hi,
                maxfix,
                Some(&mut branch_fix),
            );
            let copy_base = self.allocate_near(win_base, win_size as u32);
            let diff = copy_base as i64 - win_base as i64;
            if copy_base == 0 || diff > 0x3FFFFFFF || diff < -0x3FFFFFFF {
                continue;
            }
            for &fi in fix.iter().chain(branch_fix.iter()) {
                let fi = fi as usize;
                let v = crate::scanrip::read_i32(&buf, fi);
                let nv = ((v as i64) - diff) as i32;
                let new_val_bytes = nv.to_le_bytes();
                buf[fi] = new_val_bytes[0];
                buf[fi + 1] = new_val_bytes[1];
                buf[fi + 2] = new_val_bytes[2];
                buf[fi + 3] = new_val_bytes[3];
            }
            total_fix += fix.len() + branch_fix.len();
            let mut wr: usize = 0;
            let wrote = unsafe {
                WriteProcessMemory(
                    self.proc,
                    copy_base as usize as *const c_void,
                    buf.as_ptr() as *const c_void,
                    win_size,
                    &mut wr,
                )
            };
            if wrote == 0 || wr != win_size {
                continue;
            }
            let mut e = [0u8; 24];
            e[0..8].copy_from_slice(&win_base.to_le_bytes());
            e[8..16].copy_from_slice(&copy_base.to_le_bytes());
            e[16..24].copy_from_slice(&(win_size as u64).to_le_bytes());
            entries.push(e);
        }
        if entries.is_empty() {
            println!("{{\"error\":\"no shadow windows built\"}}");
            return 1;
        }

        let count = entries.len();
        let payload_size = 8 + 24 * count;
        let mut payload = vec![0u8; payload_size];
        payload[0..4].copy_from_slice(&(count as u32).to_le_bytes());
        payload[4..8].copy_from_slice(&2u32.to_le_bytes());
        for (i, e) in entries.iter().enumerate() {
            payload[8 + 24 * i..8 + 24 * i + 24].copy_from_slice(e);
        }
        let name: Vec<u16> = "ShadowRegions"
            .encode_utf16()
            .chain(std::iter::once(0))
            .collect();
        let map = unsafe {
            CreateFileMappingW(
                INVALID_HANDLE_VALUE,
                core::ptr::null(),
                PAGE_READWRITE,
                0,
                payload_size as u32,
                name.as_ptr(),
            )
        };
        if !map.is_null() {
            let view = unsafe { MapViewOfFile(map, FILE_MAP_WRITE, 0, 0, 0) };
            if !view.Value.is_null() {
                unsafe {
                    core::ptr::copy_nonoverlapping(payload.as_ptr(), view.Value as *mut u8, payload_size)
                };
                unsafe { UnmapViewOfFile(view) };
            }
        }
        let injected = match self.shadow_dll_path() {
            Some(dll) => self.inject_library(&dll),
            None => false,
        };
        let armed = if arm { self.shadow_arm_pages(regions) } else { 0 };
        if !map.is_null() {
            unsafe { CloseHandle(map) };
        }
        println!("{{\"mode\":\"shadow\",\"build\":\"{}\",\"textBase\":\"0x{:x}\",\"windows\":{},\"regions\":{},\"fixups\":{},\"injected\":{},\"armedPages\":{}}}",
            build, text_base, count, region_count, total_fix, if injected {"true"} else {"false"}, armed);
        if injected {
            0
        } else {
            1
        }
    }

    fn build_nodes(
        &self,
        address: u64,
        direct: bool,
        name_off: i32,
        children_off: i32,
        depth: i32,
    ) -> TNode {
        let h = self.proc;
        let mut rd = |a: u64, b: &mut [u8]| read_zero(h, a, b);
        let mut node = TNode::new();
        let z2 = [0i32, 0i32];
        let z1 = [0i32];
        let num = if direct {
            address
        } else {
            crate::memread::mr_resolve_offset_chain(&mut rd, address, &z2)
        };
        let name_addr =
            crate::memread::mr_resolve_offset_chain(&mut rd, num + name_off as u64, &z1);
        let name_bytes = crate::memread::mr_read_ascii(&mut rd, name_addr, 100, 128);
        let name = String::from_utf8_lossy(&name_bytes);
        node.text = if name.is_empty() {
            "<No Name>".to_string()
        } else {
            name.into_owned()
        };
        node.id = format!("{}", crate::memread::mr_read_pointer(&mut rd, address));
        if depth >= 12 {
            return node;
        }
        let cnt = crate::memread::mr_read_int16(&mut rd, num + children_off as u64 + 8);
        let kids_base =
            crate::memread::mr_resolve_offset_chain(&mut rd, num + children_off as u64, &z1);
        for j in 0..cnt {
            let child =
                self.build_nodes(kids_base + (j as u64) * 8, false, name_off, children_off, depth + 1);
            node.kids.push(child);
        }
        node
    }
}

#[derive(Clone)]
struct TNode {
    text: String,
    id: String,
    kids: Vec<TNode>,
}

impl TNode {
    fn new() -> TNode {
        TNode {
            text: String::new(),
            id: String::new(),
            kids: Vec::new(),
        }
    }
    fn nkid(&self) -> usize {
        self.kids.len()
    }
}

fn st(node: &mut TNode, path: &[usize], t: &str) {
    let mut cur = node;
    for &i in path {
        match cur.kids.get_mut(i) {
            Some(n) => cur = n,
            None => return,
        }
    }
    cur.text = t.to_string();
}

fn rm(node: &mut TNode, path: &[usize], idx: usize) {
    let mut cur = node;
    for &i in path {
        match cur.kids.get_mut(i) {
            Some(n) => cur = n,
            None => return,
        }
    }
    if idx < cur.kids.len() {
        cur.kids.remove(idx);
    }
}

fn get_path<'a>(node: &'a TNode, path: &[usize]) -> Option<&'a TNode> {
    let mut cur = node;
    for &i in path {
        cur = cur.kids.get(i)?;
    }
    Some(cur)
}

fn map_display(raw: &str) -> String {
    for (r, d) in MAP_NAMES {
        if *r == raw {
            return d.to_string();
        }
    }
    raw.to_string()
}

fn gt_normalize(raw: &str) -> String {
    for (r, d) in GAMETYPE_NAMES {
        if *r == raw {
            return d.to_string();
        }
    }
    raw.to_string()
}

fn json_escape(s: &str, out: &mut String) {
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
}

fn tn_json(node: &TNode, depth: i32, out: &mut String) {
    out.push_str("{\"text\":");
    json_escape(&node.text, out);
    out.push_str(",\"id\":");
    json_escape(&node.id, out);
    out.push_str(",\"children\":[");
    if depth < 4 {
        for (i, k) in node.kids.iter().enumerate() {
            if i != 0 {
                out.push(',');
            }
            tn_json(k, depth + 1, out);
        }
    }
    out.push_str("]}");
}

fn label_multiplayer(node: &mut TNode, season: i32) {
    node.text = "Multiplayer".to_string();
    st(node, &[0], "Hostage");
    st(node, &[1], "Secure Area");
    st(node, &[2], "Bomb");
    if season >= SEASON_Y1S2 {
        st(node, &[3], "Warmup");
    }
    if season >= SEASON_Y2S1 {
        st(node, &[4], "Canister");
    }
    for i in 0..node.nkid() {
        let mut j = 0;
        while j < node.kids[i].kids.len() {
            let disp = map_display(&node.kids[i].kids[j].text);
            node.kids[i].kids[j].text = disp;
            if let Some(k0) = node.kids[i].kids[j].kids.get_mut(0) {
                k0.text = "Day".to_string();
            }
            if node.kids[i].kids[j].kids.len() > 1 {
                node.kids[i].kids[j].kids[1].text = "Night".to_string();
            }
            let rmv = {
                let t = &node.kids[i].kids[j].text;
                t == "!!FLOYD" || t == "!!Staduim Playlist" || t == "!!Western"
            };
            if rmv {
                node.kids[i].kids.remove(j);
                continue;
            }
            j += 1;
        }
        if season == SEASON_Y1S2 && node.kids[i].kids.len() > 13 {
            node.kids[i].kids.remove(13);
        }
        if season == SEASON_Y2S3 && node.kids[i].kids.len() > 13 {
            node.kids[i].kids.remove(17);
        }
    }
}

fn label_terrorist_hunt(node: &mut TNode, season: i32) {
    node.text = "Terrorist Hunt".to_string();
    st(node, &[0], "Normal");
    st(node, &[1], "Hard");
    st(node, &[2], "Realistic");
    for i in 0..node.nkid() {
        for j in 0..node.kids[i].nkid() {
            st(&mut node.kids[i].kids[j], &[0], "Hostage");
            st(&mut node.kids[i].kids[j], &[1], "Disarm Bomb");
            st(&mut node.kids[i].kids[j], &[2], "Elimination");
            let disp = map_display(&node.kids[i].kids[j].text);
            node.kids[i].kids[j].text = disp;
            for k in 0..node.kids[i].kids[j].nkid() {
                for m in 0..node.kids[i].kids[j].kids[k].nkid() {
                    let d = gt_normalize(&node.kids[i].kids[j].kids[k].kids[m].text);
                    node.kids[i].kids[j].kids[k].kids[m].text = d;
                }
            }
        }
        if season == SEASON_Y1S2 && node.kids[i].nkid() > 13 {
            node.kids[i].kids.remove(13);
        }
        if season == SEASON_Y2S3 && node.kids[i].nkid() > 13 {
            node.kids[i].kids.remove(17);
        }
        if season == SEASON_Y3S2 {
            st(&mut node.kids[i], &[18], "Villa");
        }
        if season >= SEASON_Y3S3 {
            st(&mut node.kids[i], &[18], "Hereford Base Rework");
            st(&mut node.kids[i], &[17], "Villa");
        }
    }
}

fn label_situation(node: &mut TNode, advanced_order: i32) {
    node.text = "Situations".to_string();
    st(node, &[0], "01 CQB Basics");
    st(node, &[1], "02 Suburban Extraction");
    if advanced_order != 0 {
        st(node, &[2], "03 Tubular Assault");
        st(node, &[3], "04 Asset Protection");
        st(node, &[4], "05 Improvise Defense");
        st(node, &[5], "06 No Intel");
        st(node, &[6], "07 Cold Zero");
        st(node, &[7], "08 High Value Target");
        st(node, &[8], "09 Neutralize Cell");
    } else {
        st(node, &[2], "03 High Value Target");
        st(node, &[3], "04 Tubular Assault");
        st(node, &[4], "05 Cold Zero");
        st(node, &[5], "06 Asset Protection");
        st(node, &[6], "07 Neutralize Cell");
        st(node, &[7], "08 No Intel");
        st(node, &[8], "09 Improvise Defense");
    }
    st(node, &[9], "10 Heavily Fortified");
    st(node, &[10], "Article 5");
    for i in 0..node.nkid() {
        if node.kids[i].nkid() > 0 {
            st(&mut node.kids[i], &[0], "Normal");
            st(&mut node.kids[i], &[1], "Hard");
            st(&mut node.kids[i], &[2], "Realistic");
        }
    }
}

fn label_matchmaking(node: &mut TNode) {
    node.text = "Matchmaking".to_string();
    st(node, &[0], "Casual");
    st(node, &[0, 0], "Hostage");
    st(node, &[0, 1], "Bomb");
    st(node, &[0, 2], "Secure Area");
    st(node, &[1], "Ranked");
    st(node, &[1, 0], "Hostage");
    st(node, &[1, 1], "Bomb");
    st(node, &[1, 2], "Secure Area");
    if node.nkid() == 3 {
        st(node, &[2], "Unranked");
        st(node, &[2, 0], "Bomb");
    }
}

fn label_gym(node: &mut TNode, season: i32) {
    node.text = "Development - Gym".to_string();
    st(node, &[0], "Day");
    st(node, &[1], "Night");
    for i in 0..node.nkid() {
        if node.kids[i].nkid() == 12 {
            for j in 0..node.kids[i].nkid() {
                let d = map_display(&node.kids[i].kids[j].text);
                node.kids[i].kids[j].text = d;
            }
            continue;
        }
        let d = map_display(&node.kids[i].text);
        node.kids[i].text = d;
    }
    if season == SEASON_Y1S2 {
        rm(node, &[], 15);
    }
    if season >= SEASON_Y2S3 {
        rm(node, &[], 0);
        rm(node, &[], 0);
    }
}

fn label_video_review(node: &mut TNode) {
    node.text = "Development - Video Review".to_string();
    for i in 0..node.nkid() {
        st(&mut node.kids[i], &[0], "House (Benchmark)");
        for j in 0..node.kids[i].nkid() {
            let d = map_display(&node.kids[i].kids[j].text);
            node.kids[i].kids[j].text = d;
        }
    }
}

fn label_outbreak(node: &mut TNode) {
    node.text = "Outbreak".to_string();
    st(node, &[0], "Missions");
    st(node, &[0, 0], "Sierra Paradise");
    st(node, &[0, 1], "Sierra Paradise Part 2");
    st(node, &[0, 2], "Sierra Veterans Wing");
    st(node, &[0, 3], "Sierra Veterans Wing Part 2");
    st(node, &[0, 4], "The Nest");
    st(node, &[0, 5], "The Nest Part 2");
    rm(node, &[1], 0);
    rm(node, &[1], 0);
    rm(node, &[1], 0);
    rm(node, &[1], 0);
    st(node, &[1], "Development - Gym");
    st(node, &[1, 0], "Art Review");
    st(node, &[1, 0, 0], "Sierra Paradise");
    st(node, &[1, 0, 1], "Sierra Paradise Part 2");
    st(node, &[1, 0, 2], "Sierra Veterans Wing");
    st(node, &[1, 0, 3], "Sierra Veterans Wing Part 2");
    st(node, &[1, 0, 4], "The Nest");
    st(node, &[1, 0, 5], "The Nest Part 2");
    rm(node, &[], 2);
}

fn json_find(line: &str, key: &str) -> Option<usize> {
    let tok = format!("\"{}\"", key);
    let p = line.find(&tok)?;
    let b = line.as_bytes();
    let mut i = p + tok.len();
    while i < b.len() && (b[i] == b' ' || b[i] == b'\t') {
        i += 1;
    }
    if i >= b.len() || b[i] != b':' {
        return None;
    }
    i += 1;
    while i < b.len() && (b[i] == b' ' || b[i] == b'\t') {
        i += 1;
    }
    Some(i)
}

fn json_str(line: &str, key: &str) -> Option<String> {
    let i = json_find(line, key)?;
    let b = line.as_bytes();
    if i >= b.len() || b[i] != b'"' {
        return None;
    }
    let mut j = i + 1;
    let mut out = String::new();
    while j < b.len() && b[j] != b'"' {
        out.push(b[j] as char);
        j += 1;
    }
    Some(out)
}

fn json_bool(line: &str, key: &str) -> i32 {
    match json_find(line, key) {
        Some(i) => {
            if line[i..].starts_with("true") {
                1
            } else {
                0
            }
        }
        None => -1,
    }
}

fn json_find_int(line: &str, key: &str) -> i64 {
    match json_find(line, key) {
        Some(i) => lead_i64(&line[i..]),
        None => 0,
    }
}

pub struct Daemon {
    eng: Engine,
    client: SOCKET,
    build: String,
    attached: bool,
    ready: bool,
    applied: bool,
    pending: bool,
    countdown: i32,
    shadow_injected: bool,
    status: String,
    tier: String,
    season: i32,
    disable_primary: bool,
    disable_secondary: bool,
    force: bool,
    lastsig: String,
}

fn bs_season_of(build: &str) -> i32 {
    for (b, s) in BUILD_SEASONS {
        if *b == build {
            return *s;
        }
    }
    -1
}

impl Daemon {
    fn new() -> Daemon {
        Daemon {
            eng: Engine::new(),
            client: INVALID_SOCKET,
            build: String::new(),
            attached: false,
            ready: false,
            applied: false,
            pending: true,
            countdown: 0,
            shadow_injected: false,
            status: "Waiting for R6S to launch".to_string(),
            tier: String::new(),
            season: -1,
            disable_primary: false,
            disable_secondary: false,
            force: false,
            lastsig: String::new(),
        }
    }

    fn d_send(&self, s: &str) {
        if self.client == INVALID_SOCKET {
            return;
        }
        unsafe {
            send(self.client, s.as_ptr(), s.len() as i32, 0);
            send(self.client, b"\n".as_ptr(), 1, 0);
        }
    }

    fn apply_static(&self, feature: &str, branch: &str) {
        for line in PATCHES_DATA.split('\n') {
            if line.is_empty() {
                continue;
            }
            let mut it = line.split(' ').filter(|s| !s.is_empty());
            let kind = match it.next() {
                Some(x) => x,
                None => continue,
            };
            let feat = match it.next() {
                Some(x) => x,
                None => continue,
            };
            let pbuild = match it.next() {
                Some(x) => x,
                None => continue,
            };
            let pbranch = match it.next() {
                Some(x) => x,
                None => continue,
            };
            let addr_s = match it.next() {
                Some(x) => x,
                None => continue,
            };
            let rel_s = match it.next() {
                Some(x) => x,
                None => continue,
            };
            if feat != feature || pbuild != self.build || pbranch != branch {
                continue;
            }
            let addr: u64 = match addr_s.parse() {
                Ok(v) => v,
                Err(_) => continue,
            };
            let rel = rel_s.parse::<i64>().unwrap_or(0) != 0;
            let mut bytes: Vec<u8> = Vec::new();
            let abs;
            if kind == "SI" {
                let vals = it.next().unwrap_or("");
                abs = write_scrambled_ints_addr(addr, rel, self.eng.base);
                for v in parse_csv_ints(vals) {
                    if bytes.len() >= 64 {
                        break;
                    }
                    bytes.push(write_scrambled_ints_byte(v as i32));
                }
            } else {
                let count = it.next().and_then(|s| s.parse::<i32>().ok()).unwrap_or(0);
                let usenop = it.next().and_then(|s| s.parse::<i32>().ok()).unwrap_or(0);
                abs = write_nops_addr(addr, rel, self.eng.base);
                for _ in 0..count {
                    if bytes.len() >= 64 {
                        break;
                    }
                    bytes.push(if usenop != 0 { 0x90 } else { 0x00 });
                }
            }
            self.eng.write_mem(abs, &bytes);
        }
    }

    fn apply_weapons(&self) {
        if self.disable_primary
            && self.disable_secondary
            && self.season >= 0
            && self.season < SEASON_Y2S3
        {
            self.apply_static("SetEmptySecondary", "enable");
            self.apply_static("SetDisablePrimaryWeapon", "enable");
        } else {
            self.apply_static("SetEmptySecondary", "disable");
            self.apply_static(
                "SetDisablePrimaryWeapon",
                if self.disable_primary { "enable" } else { "disable" },
            );
            self.apply_static(
                "SetDisableSecondaryWeapon",
                if self.disable_secondary { "enable" } else { "disable" },
            );
        }
    }

    fn disable_self_terminate(&self) {
        let c3 = [0xC3u8];
        let tp = unsafe {
            GetProcAddress(
                GetModuleHandleA(b"kernel32.dll\0".as_ptr()),
                b"TerminateProcess\0".as_ptr(),
            )
        };
        let ntp = unsafe {
            GetProcAddress(
                GetModuleHandleA(b"ntdll.dll\0".as_ptr()),
                b"NtTerminateProcess\0".as_ptr(),
            )
        };
        if let Some(f) = tp {
            self.eng.write_mem(f as usize as u64, &c3);
        }
        if let Some(f) = ntp {
            self.eng.write_mem(f as usize as u64, &c3);
        }
    }

    fn is_in_match(&self) -> bool {
        let fc = match self.eng.find_chain("IsInMatch", &self.build) {
            Some(f) => f,
            None => return false,
        };
        let v = self.eng.read1(self.eng.resolve_chain_live(fc));
        if self.season <= SEASON_Y1S3 {
            v == 6
        } else {
            v == 7
        }
    }

    fn set_mod(&mut self, mod_: &str, enabled: bool) {
        if self.eng.proc.is_null() || self.build.is_empty() || !self.ready {
            return;
        }
        let table = [
            ("godMode", "SetGodMode"),
            ("disableAI", "SetDisableAI"),
            ("unlimitedAmmo", "SetUnlimitedAmmo"),
            ("unlimitedEquip", "SetUnlimitedEquipment"),
            ("disableSpecialGadget", "SetDisableSpecialGadget"),
            ("disableGadget", "SetDisableGadget"),
            ("displayBuild", "SetDisplayBuild"),
        ];
        for (name, feature) in table {
            if mod_ == name {
                self.apply_static(feature, if enabled { "enable" } else { "disable" });
                return;
            }
        }
        if mod_ == "infiniteTime" {
            if let Some(fc) = self.eng.find_chain("SetInfiniteTime", &self.build) {
                let num = self.eng.resolve_chain_live(fc);
                let v: u8 = if enabled { 0 } else { 1 };
                self.eng.write_mem(num, &[v]);
            }
            return;
        }
        if mod_ == "harvard" {
            if let Some(fc) = self.eng.find_chain("SetHarvard", &self.build) {
                let a = self.eng.resolve_chain_live(fc);
                self.eng
                    .write_int64(a, if enabled { HARVARD_VALUE_A } else { HARVARD_VALUE_B });
            }
            return;
        }
        if mod_ == "oldHereford" {
            if let Some(fc) = self.eng.find_chain("SetOldHereford", &self.build) {
                let a = self.eng.resolve_chain_live(fc);
                self.eng.write_int64(
                    a,
                    if enabled {
                        OLD_HEREFORD_VALUE_A
                    } else {
                        OLD_HEREFORD_VALUE_B
                    },
                );
            }
            return;
        }
        if mod_ == "disablePrimary" {
            self.disable_primary = enabled;
            self.apply_weapons();
        } else if mod_ == "disableSecondary" {
            self.disable_secondary = enabled;
            self.apply_weapons();
        }
    }

    fn set_gametype(&self, id_str: &str) {
        if self.eng.proc.is_null() || self.build.is_empty() || !self.ready {
            return;
        }
        let id: i64 = id_str.parse().unwrap_or(0);
        if let Some(fc) = self.eng.find_chain("SetGametype", &self.build) {
            let num = self.eng.resolve_chain_live(fc);
            self.eng.write_mem(num, &id.to_le_bytes());
        }
    }

    fn is_ready(&self) -> bool {
        for (b, addr) in IS_READY {
            if *b == self.build {
                let a = read_scrambled_bool_addr(*addr, true, self.eng.base);
                return self.eng.read1(a) != 0;
            }
        }
        self.season > SEASON_Y4S4
    }

    fn set_loading_status(&mut self) {
        if self.season >= 0 && (self.season as usize) < SEASON_NAMES_COUNT {
            self.status = format!("Loading {}", SEASON_NAMES[self.season as usize]);
        } else {
            self.status = "Loading".to_string();
        }
    }

    fn reset_attach_state(&mut self) {
        self.build.clear();
        self.season = -1;
        self.ready = false;
        self.applied = false;
        self.pending = true;
        self.countdown = 0;
        self.shadow_injected = false;
    }

    fn apply_event_mode(&self, root: &mut TNode, em: &str) {
        if root.kids.is_empty() {
            return;
        }
        match em {
            "Mad_House" => {
                let mp = &mut root.kids[0];
                if let Some(c) = get_path(mp, &[2, 0, 2, 0]).cloned() {
                    mp.kids.push(c);
                }
                rm(mp, &[2, 0], 2);
                st(mp, &[5], "Mad House");
            }
            "Rainbow_Is_Magic" => {
                let mp = &mut root.kids[0];
                if let Some(c) = get_path(mp, &[0, 21, 0]).cloned() {
                    mp.kids.push(c);
                }
                rm(mp, &[0], 21);
                st(mp, &[5], "Rainbow is Magic");
            }
            "Showdown" => {
                let mp = &mut root.kids[0];
                if let Some(c) = get_path(mp, &[1, 21, 0]).cloned() {
                    mp.kids.push(c);
                }
                rm(mp, &[1], 21);
                st(mp, &[5], "Showdown");
            }
            "Doktors_Curse_MoneyHeist" => {
                {
                    let mp = &mut root.kids[0];
                    if let Some(c) = get_path(mp, &[5, 0, 0]).cloned() {
                        mp.kids.push(c);
                    }
                    rm(mp, &[], 5);
                    st(mp, &[5], "Money Heist");
                }
                let offsets = [9586i32, 9650, 10850, 9714];
                let chain = self.eng.resolve_ptr_chain(198401266, &offsets);
                let h = self.eng.proc;
                let idv = {
                    let mut rd = |a: u64, b: &mut [u8]| read_zero(h, a, b);
                    crate::memread::mr_read_pointer(&mut rd, chain)
                };
                root.kids[0].kids.push(TNode {
                    text: "Doktor's Curse".to_string(),
                    id: format!("{}", idv),
                    kids: Vec::new(),
                });
            }
            "Stadium" => {
                let mp = &mut root.kids[0];
                if let Some(c) = get_path(mp, &[5, 0, 0]).cloned() {
                    mp.kids.push(c);
                }
                rm(mp, &[], 5);
                st(mp, &[5], "Road To S.I. 2020");
            }
            _ => {}
        }
    }

    fn build_tree_json(&self, build: &str) -> String {
        let tp = match TREE_PARAMS.iter().find(|t| t.build == build) {
            Some(t) => t,
            None => return "{\"event\":\"tree\",\"tree\":null}".to_string(),
        };
        let root_addr = self.eng.resolve_ptr_chain(tp.root_base, tp.root_offs);
        if tp.root_count <= 0 || root_addr == 0 {
            return "{\"event\":\"tree\",\"tree\":null}".to_string();
        }
        let nroot = tp.root_count.min(64);
        let mut rh = TNode::new();
        {
            let h = self.eng.proc;
            for i in 0..nroot {
                let mut rd = |a: u64, b: &mut [u8]| read_zero(h, a, b);
                let a = crate::memread::mr_read_pointer(
                    &mut rd,
                    root_addr + (i as u64) * (tp.stride as u64),
                );
                let child = self.eng.build_nodes(a, true, tp.name_off, tp.children_off, 0);
                rh.kids.push(child);
            }
        }
        self.apply_event_mode(&mut rh, tp.event_mode);
        let mut rem: Vec<i32> = tp.remove.iter().copied().take(8).collect();
        rem.sort_unstable_by(|a, b| b.cmp(a));
        for r in rem {
            if r >= 0 && (r as usize) < rh.kids.len() {
                rh.kids.remove(r as usize);
            }
        }
        if tp.i_mp >= 0 {
            if let Some(t) = rh.kids.get_mut(tp.i_mp as usize) {
                label_multiplayer(t, self.season);
            }
        }
        if tp.i_th >= 0 {
            if let Some(t) = rh.kids.get_mut(tp.i_th as usize) {
                label_terrorist_hunt(t, self.season);
            }
        }
        if tp.i_mm >= 0 {
            if let Some(t) = rh.kids.get_mut(tp.i_mm as usize) {
                label_matchmaking(t);
            }
        }
        if tp.i_situ >= 0 {
            if let Some(t) = rh.kids.get_mut(tp.i_situ as usize) {
                label_situation(t, tp.situ_adv);
            }
        }
        if tp.i_vr != -1 {
            if let Some(t) = rh.kids.get_mut(tp.i_vr as usize) {
                label_video_review(t);
            }
        }
        if tp.i_gym != -1 {
            if let Some(t) = rh.kids.get_mut(tp.i_gym as usize) {
                label_gym(t, self.season);
            }
        }
        if tp.i_ob != -1 {
            if let Some(t) = rh.kids.get_mut(tp.i_ob as usize) {
                label_outbreak(t);
            }
        }
        let mut out =
            String::from("{\"event\":\"tree\",\"tree\":{\"text\":\"Multiplayer\",\"id\":\"0\",\"children\":[");
        for (i, k) in rh.kids.iter().enumerate() {
            if i != 0 {
                out.push(',');
            }
            tn_json(k, 0, &mut out);
        }
        out.push_str("]}}");
        out
    }

    fn build_state(&self) -> String {
        let detected = self.attached && !self.build.is_empty() && self.season >= 0;
        let s = self.season;
        let full = detected && s <= SEASON_Y4S4;
        let harvard = full && s < SEASON_Y2S1 && s != SEASON_Y1S3;
        let old_hereford = self.build == "Y4S2_13147883";
        let display_build = full && s >= SEASON_Y2S4;
        let mad_house = self.build == "Y3S3_12362767";
        let end_r = full && s >= SEASON_Y1S2;
        let unlock_all = detected && s > SEASON_Y4S4;
        let jb = |b: bool| if b { "true" } else { "false" };
        format!(
            "{{\"event\":\"state\",\"attached\":{},\"tier\":\"{}\",\"ready\":{},\"status\":\"{}\",\"capabilities\":{{\"godMode\":{},\"disableAI\":{},\"unlimitedAmmo\":{},\"unlimitedEquip\":{},\"infiniteTime\":{},\"disablePrimary\":{},\"disableSecondary\":{},\"disableSpecialGadget\":{},\"disableGadget\":{},\"harvard\":{},\"oldHereford\":{},\"displayBuild\":{},\"madHouse\":{},\"endRound\":{},\"endMatch\":{},\"playlist\":{},\"unlockAll\":{}}},\"madHouseVariants\":[\"Mad House\",\"Hostage\",\"Secure\",\"Bomb\",\"Warmup\",\"Canister\",\"Gym\"]}}",
            jb(self.attached), self.tier, jb(self.ready), self.status,
            jb(full), jb(full), jb(full), jb(full), jb(full), jb(full), jb(full), jb(full),
            jb(full), jb(harvard), jb(old_hereford), jb(display_build), jb(mad_house),
            jb(end_r), jb(end_r), jb(full), jb(unlock_all)
        )
    }

    fn push_state(&mut self) {
        let s = self.build_state();
        if !self.force && s == self.lastsig {
            return;
        }
        self.force = false;
        self.lastsig = s.clone();
        self.d_send(&s);
    }

    fn attach_tick(&mut self) {
        let was_attached = self.attached;
        if !self.eng.proc.is_null() {
            unsafe { CloseHandle(self.eng.proc) };
            self.eng.proc = core::ptr::null_mut();
        }
        if !self.eng.attach() {
            if was_attached {
                std::process::exit(0);
            }
            self.attached = false;
            self.reset_attach_state();
            self.tier.clear();
            self.status = "Waiting for R6S to launch".to_string();
            return;
        }
        self.attached = true;
        let scanned = match self.eng.detect_build() {
            Some(s) => s,
            None => {
                self.reset_attach_state();
                self.tier.clear();
                self.status = "Loading".to_string();
                return;
            }
        };
        let b = engine_map_build(&scanned);
        if b == "None" {
            self.reset_attach_state();
            self.tier.clear();
            self.status = "This game build is not supported".to_string();
            return;
        }
        if self.build.is_empty() || self.build != b {
            self.build = b.to_string();
            self.season = bs_season_of(&self.build);
            self.tier = if self.season > SEASON_Y4S4 {
                "unlockAll".to_string()
            } else {
                "fullMods".to_string()
            };
        }
        let shadow_enabled = shadow_regions_for_build(&self.build)
            .map(|r| !r.is_empty())
            .unwrap_or(false);
        if shadow_enabled && !self.shadow_injected {
            self.shadow_injected = self.eng.run_shadow(&self.build, false, false) == 0;
        }
        if self.pending {
            self.set_loading_status();
            let ready = if shadow_enabled {
                self.shadow_injected
            } else {
                self.is_ready()
            };
            if !ready {
                return;
            }
            self.pending = false;
            self.countdown = 4;
            if self.season <= SEASON_Y4S4 {
                let tj = self.build_tree_json(&self.build);
                self.d_send(&tj);
            }
            return;
        }
        if self.countdown > 0 {
            self.countdown -= 1;
            return;
        }
        if !self.applied {
            self.disable_self_terminate();
            if shadow_enabled {
                if let Some(r) = shadow_regions_for_build(&self.build) {
                    self.eng.shadow_arm_pages(r);
                }
            }
            self.apply_static("ApplyCorePatch", "always");
            self.applied = true;
            self.ready = true;
        }
        self.status = if self.season > SEASON_Y4S4 {
            "Unlock All has been applied".to_string()
        } else {
            "Idle".to_string()
        };
    }

    fn handle_command(&mut self, line: &str) {
        let cmd = match json_str(line, "cmd") {
            Some(c) => c,
            None => return,
        };
        match cmd.as_str() {
            "setMod" => {
                if let Some(m) = json_str(line, "mod") {
                    self.set_mod(&m, json_bool(line, "enabled") == 1);
                }
            }
            "setGametype" => {
                if let Some(id) = json_str(line, "gametypeId") {
                    self.set_gametype(&id);
                }
            }
            "applyUnlockAll" => {
                if !self.eng.proc.is_null() && !self.build.is_empty() && self.ready {
                    self.apply_static("ApplyCorePatch", "always");
                }
            }
            "setMadHouse" => {
                if !self.eng.proc.is_null() && self.ready && self.build == "Y3S3_12362767" {
                    if let Some(fc) = self.eng.find_chain("SetMadHouseMode", "*") {
                        let variant = json_find_int(line, "variant");
                        let val = if variant == 0 {
                            MADHOUSE_VARIANT0
                        } else if variant >= 1 && variant <= 6 {
                            MADHOUSE_GAMETYPES[(variant - 1) as usize]
                        } else {
                            0
                        };
                        let a = self.eng.resolve_chain_live(fc);
                        self.eng.write_int64(a, val);
                    }
                }
            }
            "endRound" => {
                if !self.eng.proc.is_null()
                    && !self.build.is_empty()
                    && self.ready
                    && self.is_in_match()
                {
                    if let Some(fc) = self.eng.find_chain("EndRound", &self.build) {
                        let a = self.eng.resolve_chain_live(fc);
                        self.eng.write_mem(a, &[1u8]);
                    }
                }
            }
            "endMatch" => {
                if !self.eng.proc.is_null()
                    && !self.build.is_empty()
                    && self.ready
                    && self.is_in_match()
                {
                    if let Some(fc) = self.eng.find_chain("EndMatch", &self.build) {
                        let a = self.eng.resolve_chain_live(fc);
                        self.eng.write_mem(a, &[1u8]);
                    }
                }
            }
            "requestTree" => {
                if !self.eng.proc.is_null() && !self.build.is_empty() && self.ready {
                    let tj = self.build_tree_json(&self.build);
                    self.d_send(&tj);
                } else {
                    self.d_send("{\"event\":\"tree\",\"tree\":null}");
                }
            }
            _ => {}
        }
        self.force = true;
    }

    fn run_daemon(&mut self, port_file: &str) -> i32 {
        let mut wsadata: WSADATA = unsafe { zeroed() };
        if unsafe { WSAStartup(0x0202, &mut wsadata) } != 0 {
            return 1;
        }
        let ls = unsafe { socket(2, 1, 0) };
        if ls == INVALID_SOCKET {
            return 1;
        }
        let mut addr: SOCKADDR_IN = unsafe { zeroed() };
        addr.sin_family = 2;
        addr.sin_addr = IN_ADDR {
            S_un: IN_ADDR_0 {
                S_addr: unsafe { htonl(0x7f000001) },
            },
        };
        addr.sin_port = 0;
        let bound = unsafe {
            bind(
                ls,
                &addr as *const SOCKADDR_IN as *const SOCKADDR,
                size_of::<SOCKADDR_IN>() as i32,
            )
        };
        if bound != 0 || unsafe { listen(ls, 1) } != 0 {
            return 1;
        }
        let mut alen = size_of::<SOCKADDR_IN>() as i32;
        unsafe {
            getsockname(
                ls,
                &mut addr as *mut SOCKADDR_IN as *mut SOCKADDR,
                &mut alen,
            )
        };
        let port = unsafe { ntohs(addr.sin_port) };
        if let Ok(mut f) = std::fs::File::create(port_file) {
            use std::io::Write;
            let _ = write!(f, "{}", port);
        }
        self.client = unsafe { accept(ls, core::ptr::null_mut(), core::ptr::null_mut()) };
        if self.client == INVALID_SOCKET {
            return 1;
        }
        let mut rbuf = vec![0u8; 8192];
        let mut rlen = 0usize;
        let mut last_tick: u32 = 0;
        loop {
            let mut rf: FD_SET = unsafe { zeroed() };
            rf.fd_count = 1;
            rf.fd_array[0] = self.client;
            let tv = TIMEVAL {
                tv_sec: 0,
                tv_usec: 100000,
            };
            let sel = unsafe {
                select(
                    0,
                    &mut rf,
                    core::ptr::null_mut(),
                    core::ptr::null_mut(),
                    &tv,
                )
            };
            if sel > 0 {
                let cap = rbuf.len() - 1 - rlen;
                let n = unsafe { recv(self.client, rbuf[rlen..].as_mut_ptr(), cap as i32, 0) };
                if n <= 0 {
                    break;
                }
                rlen += n as usize;
                let mut start = 0;
                while let Some(rel) = rbuf[start..rlen].iter().position(|&c| c == b'\n') {
                    let nl = start + rel;
                    let line = String::from_utf8_lossy(&rbuf[start..nl]).into_owned();
                    if !line.is_empty() {
                        self.handle_command(&line);
                    }
                    start = nl + 1;
                }
                let leftover = rlen - start;
                rbuf.copy_within(start..rlen, 0);
                rlen = leftover;
            }
            let now = unsafe { GetTickCount() };
            if now.wrapping_sub(last_tick) >= 1000 {
                last_tick = now;
                self.attach_tick();
            }
            self.push_state();
        }
        unsafe {
            closesocket(self.client);
            closesocket(ls);
        }
        0
    }
}

pub fn main_entry() -> i32 {
    let args: Vec<String> = std::env::args().collect();
    if args.len() > 2 && args[1] == "--port-file" {
        let mut d = Daemon::new();
        return d.run_daemon(&args[2]);
    }
    if args.len() > 1 && args[1] == "sleep" {
        unsafe { Sleep(600000) };
        return 0;
    }
    if args.len() < 2 {
        eprintln!("usage: liberator detect | plan [feature|all] | apply [feature|all] | resolve [infinite-time|gametype] | infinite-time on|off | gametype <id>");
        return 2;
    }
    let mut eng = Engine::new();
    if !eng.attach() {
        println!("{{\"error\":\"process not found\"}}");
        return 1;
    }
    let scanned = match eng.detect_build() {
        Some(s) => s,
        None => {
            println!(
                "{{\"error\":\"build string not found\",\"base\":\"0x{:x}\"}}",
                eng.base
            );
            return 1;
        }
    };
    let build = engine_map_build(&scanned);
    println!(
        "{{\"scanned\":\"{}\",\"build\":\"{}\",\"base\":\"0x{:x}\"}}",
        scanned, build, eng.base
    );
    let cmd = args[1].as_str();
    if cmd == "detect" {
        return if build == "None" { 1 } else { 0 };
    }
    let feat = if args.len() > 2 { args[2].as_str() } else { "all" };
    match cmd {
        "plan" => {
            let n = iterate_patches(&eng, build, feat, eng.base, false);
            println!("{{\"planned\":{}}}", n);
            0
        }
        "apply" => {
            let n = iterate_patches(&eng, build, feat, eng.base, true);
            println!("{{\"applied\":{}}}", n);
            0
        }
        "resolve" => {
            let fn_name = if args.len() > 2 && args[2] == "gametype" {
                "SetGametype"
            } else {
                "SetInfiniteTime"
            };
            match eng.find_chain(fn_name, build) {
                Some(fc) => {
                    println!(
                        "{{\"feature\":\"{}\",\"addr\":\"0x{:x}\"}}",
                        fn_name,
                        eng.resolve_chain_live(fc)
                    );
                    0
                }
                None => {
                    println!("{{\"error\":\"no chain for build\",\"feature\":\"{}\"}}", fn_name);
                    1
                }
            }
        }
        "infinite-time" => {
            let fc = match eng.find_chain("SetInfiniteTime", build) {
                Some(fc) => fc,
                None => {
                    println!("{{\"error\":\"no chain for build\"}}");
                    return 1;
                }
            };
            let on = args.len() > 2 && args[2] == "on";
            let num = eng.resolve_chain_live(fc);
            let v: u8 = if on { 0 } else { 1 };
            let ok = eng.write_mem(num, &[v]);
            println!(
                "{{\"feature\":\"infinite-time\",\"state\":\"{}\",\"addr\":\"0x{:x}\",\"value\":{},\"written\":{}}}",
                if on { "on" } else { "off" },
                num,
                v,
                if ok { "true" } else { "false" }
            );
            if ok { 0 } else { 1 }
        }
        "gametype" => {
            if args.len() < 3 {
                println!("{{\"error\":\"gametype id required\"}}");
                return 2;
            }
            let id: i64 = args[2].parse().unwrap_or(0);
            let fc = match eng.find_chain("SetGametype", build) {
                Some(fc) => fc,
                None => {
                    println!("{{\"error\":\"no chain for build\"}}");
                    return 1;
                }
            };
            let num = eng.resolve_chain_live(fc);
            let ok = eng.write_mem(num, &id.to_le_bytes());
            println!(
                "{{\"feature\":\"gametype\",\"id\":{},\"addr\":\"0x{:x}\",\"written\":{}}}",
                id,
                num,
                if ok { "true" } else { "false" }
            );
            if ok { 0 } else { 1 }
        }
        _ => {
            eprintln!("unknown mode");
            2
        }
    }
}
