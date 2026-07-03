use liberator::buildscan::scan_build;
use liberator::descramble::{decode_bit_offset, decode_offset, resolve_patch_line, write_scrambled_ints_byte, write_nops_addr, write_scrambled_ints_addr, read_scrambled_bool_addr};
use liberator::gen::{BUILD_NAMES, GAMETYPE_NAMES, MAP_NAMES, PATCHES_DATA};
use liberator::mapbuild::engine_map_build;
use liberator::memread::{
    mr_read_ascii, mr_read_byte, mr_read_int16, mr_read_pointer, mr_resolve_offset_chain,
};
use liberator::mockmem::{mock_read8, mock_read_bytes};
use liberator::scanrip::scan_rip_rel;
use std::fs;
use std::process::exit;

fn lead_u64(s: &str) -> u64 {
    let t = s.trim_start();
    let b = t.as_bytes();
    let mut i = 0;
    while i < b.len() && b[i].is_ascii_digit() {
        i += 1;
    }
    t[..i].parse::<u64>().unwrap_or(0)
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

fn parse_csv_i32(s: &str) -> Vec<i32> {
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
                out.push(v as i32);
            }
        }
    }
    out
}

fn selfcheck() -> i32 {
    let mut fail = false;
    let mut a = 300000u64;
    while a <= 200000000u64 {
        for rel in 0..=1 {
            let relative = rel != 0;
            let base = if relative { 0x140000000u64 } else { 0u64 };
            let expect_nops = decode_bit_offset(a) / 2
                + if relative { base.wrapping_sub(1) } else { 0 };
            if write_nops_addr(a, relative, base) != expect_nops {
                fail = true;
            }
            if read_scrambled_bool_addr(a, relative, base) != write_nops_addr(a, relative, base) {
                fail = true;
            }
            let wsi_direct = write_scrambled_ints_addr(a, relative, base);
            let wsi_via = (decode_bit_offset(a).wrapping_sub(4)) / 2 + 1
                + if relative { base } else { 0 };
            if wsi_direct != wsi_via {
                fail = true;
            }
        }
        a += 7777;
    }
    if write_scrambled_ints_byte(222) != 235 {
        fail = true;
    }
    if write_scrambled_ints_byte(-13) != 0 {
        fail = true;
    }
    eprintln!("selfcheck {}", if fail { "FAIL" } else { "PASS" });
    if fail {
        1
    } else {
        0
    }
}

fn descramble_default(inp: &str, outp: &str) {
    let data = fs::read_to_string(inp).expect("open in");
    let mut out = String::new();
    for line in data.lines() {
        let b = line.as_bytes();
        if b.is_empty() {
            continue;
        }
        let kind = b[0];
        let rest = if line.len() >= 2 { &line[2..] } else { "" };
        if kind == b'O' {
            let v = lead_i64(rest);
            let r = decode_offset(v as i32);
            out.push_str(&format!("O {} {}\n", v, r));
        } else if kind == b'B' {
            let v = lead_u64(rest);
            let r = decode_bit_offset(v);
            out.push_str(&format!("B {} {}\n", v, r));
        }
    }
    fs::write(outp, out).expect("write out");
}

fn emit_patches(inp: &str, outp: &str) {
    let data = fs::read_to_string(inp).expect("open in");
    let mut out = String::new();
    for line in data.lines() {
        if line.is_empty() {
            continue;
        }
        if let Some(r) = resolve_patch_line(line) {
            out.push_str(&r);
            out.push('\n');
        }
    }
    fs::write(outp, out).expect("write out");
}

fn resolve_chain(base_offset: u64, offsets: &[i32]) -> u64 {
    let dbase = decode_offset(base_offset as i32);
    let num = dbase;
    let mut ptr = mock_read8(num);
    let n = offsets.len();
    for i in 0..n.saturating_sub(1) {
        let num2 = ptr.wrapping_add(decode_offset(offsets[i]));
        ptr = mock_read8(num2);
    }
    ptr.wrapping_add(decode_offset(offsets[n - 1]))
}

fn chain(inp: &str, outp: &str) {
    let data = fs::read_to_string(inp).expect("open in");
    let mut out = String::new();
    for line in data.lines() {
        if line.is_empty() {
            continue;
        }
        let mut it = line.split(' ').filter(|s| !s.is_empty());
        let base_s = match it.next() {
            Some(x) => x,
            None => continue,
        };
        let mod_s = match it.next() {
            Some(x) => x,
            None => continue,
        };
        let offcsv = match it.next() {
            Some(x) => x,
            None => continue,
        };
        let base_offset = lead_u64(base_s);
        let offsets = parse_csv_i32(offcsv);
        if offsets.is_empty() {
            continue;
        }
        let r = resolve_chain(base_offset, &offsets);
        out.push_str(&format!("{} {} {} = {}\n", base_s, mod_s, offcsv, r));
    }
    fs::write(outp, out).expect("write out");
}

fn buildscan_run(inp: &str, outp: &str) {
    let data = fs::read_to_string(inp).expect("open in");
    let mut out = String::new();
    for line in data.lines() {
        match scan_build(line.as_bytes()) {
            Some(m) => {
                out.push_str(&m);
                out.push('\n');
            }
            None => out.push_str("NONE\n"),
        }
    }
    fs::write(outp, out).expect("write out");
}

fn scanrip_run(inp: &str, outp: &str) {
    let data = fs::read(inp).expect("open bin");
    let mut out = String::new();
    let mut p = 0usize;
    while p + 4 <= data.len() {
        let len = i32::from_le_bytes([data[p], data[p + 1], data[p + 2], data[p + 3]]) as usize;
        p += 4;
        if p + len > data.len() {
            break;
        }
        let buf = &data[p..p + len];
        p += len;
        let fix = scan_rip_rel(buf, 0x140001000, 0x140000000, 0x150000000, len + 16);
        for (i, f) in fix.iter().enumerate() {
            if i != 0 {
                out.push(',');
            }
            out.push_str(&f.to_string());
        }
        out.push('\n');
    }
    fs::write(outp, out).expect("write out");
}

fn memread_run(inp: &str, outp: &str) {
    let data = fs::read_to_string(inp).expect("open in");
    let mut out = String::new();
    let mut rd = |addr: u64, buf: &mut [u8]| mock_read_bytes(addr, buf);
    for line in data.lines() {
        if line.is_empty() {
            continue;
        }
        let kind = line.as_bytes()[0];
        let rest = &line[1..];
        let mut it = rest.split(' ').filter(|s| !s.is_empty());
        let a1 = match it.next() {
            Some(x) => x,
            None => continue,
        };
        match kind {
            b'P' => {
                let v = mr_read_pointer(&mut rd, lead_u64(a1));
                out.push_str(&format!("P {} => {}\n", a1, v));
            }
            b'I' => {
                let v = mr_read_int16(&mut rd, lead_u64(a1));
                out.push_str(&format!("I {} => {}\n", a1, v));
            }
            b'B' => {
                let v = mr_read_byte(&mut rd, lead_u64(a1));
                out.push_str(&format!("B {} => {}\n", a1, v));
            }
            b'O' => {
                let csv = it.next().unwrap_or("");
                let base = lead_u64(a1);
                let offs = parse_csv_i32(csv);
                let v = mr_resolve_offset_chain(&mut rd, base, &offs);
                out.push_str(&format!("O {} {} => {}\n", a1, csv, v));
            }
            b'S' => {
                let len_s = it.next().unwrap_or("");
                let addr = lead_u64(a1);
                let len = lead_i64(len_s) as i32;
                let bytes = mr_read_ascii(&mut rd, addr, len, 256);
                out.push_str(&format!("S {} {} => ", a1, len_s));
                for c in &bytes {
                    out.push_str(&format!("{:02x}", c));
                }
                out.push('\n');
            }
            _ => {}
        }
    }
    fs::write(outp, out).expect("write out");
}

fn engine_emit(outp: &str) {
    let mut out = String::new();
    for line in PATCHES_DATA.split('\n') {
        if line.is_empty() {
            continue;
        }
        if let Some(r) = resolve_patch_line(line) {
            out.push_str(&r);
            out.push('\n');
        }
    }
    fs::write(outp, out).expect("write out");
}

fn engine_selftest() -> i32 {
    let mut fail = false;
    let mut n = 0;
    for &nm in BUILD_NAMES {
        let got = engine_map_build(nm);
        if got != nm {
            eprintln!("roundtrip FAIL {} -> {}", nm, got);
            fail = true;
        }
        n += 1;
    }
    if engine_map_build("Y2S4_C89_D14_S8_11553121") != "Y2S4_11553121" {
        eprintln!("scanned-format FAIL");
        fail = true;
    }
    if engine_map_build("C1_D1_S1_99999999") != "None" {
        eprintln!("unknown-build FAIL");
        fail = true;
    }
    eprintln!(
        "map_build selftest {} ({} builds)",
        if fail { "FAIL" } else { "PASS" },
        n
    );
    if fail {
        1
    } else {
        0
    }
}

fn gt_lookup(tbl: &[(&str, &str)], raw: &str) -> String {
    for (r, d) in tbl {
        if *r == raw {
            return d.to_string();
        }
    }
    raw.to_string()
}

fn gametype_names_run(inp: &str, outp: &str) {
    let data = fs::read_to_string(inp).expect("open in");
    let mut out = String::new();
    for line in data.lines() {
        let b = line.as_bytes();
        if b.is_empty() || (b[0] != b'M' && b[0] != b'G') {
            continue;
        }
        let kind = b[0] as char;
        let name = if line.len() > 1 { &line[2..] } else { &line[1..] };
        let disp = gt_lookup(if kind == 'M' { MAP_NAMES } else { GAMETYPE_NAMES }, name);
        out.push_str(&format!("{} {} => {}\n", kind, name, disp));
    }
    fs::write(outp, out).expect("write out");
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        eprintln!("usage: verify <descramble|chain|buildscan|scanrip|memread> ...");
        exit(2);
    }
    match args[1].as_str() {
        "descramble" => {
            if args.len() > 2 && args[2] == "selfcheck" {
                exit(selfcheck());
            } else if args.len() > 4 && args[2] == "patches" {
                emit_patches(&args[3], &args[4]);
            } else if args.len() > 3 {
                descramble_default(&args[2], &args[3]);
            } else {
                eprintln!("usage: verify descramble <in> <out>");
                exit(2);
            }
        }
        "engine" => {
            if args.len() > 2 && args[2] == "selftest" {
                exit(engine_selftest());
            } else if args.len() > 3 && args[2] == "emit" {
                engine_emit(&args[3]);
            } else {
                eprintln!("usage: verify engine emit <out> | verify engine selftest");
                exit(2);
            }
        }
        "chain" => chain(&args[2], &args[3]),
        "buildscan" => buildscan_run(&args[2], &args[3]),
        "scanrip" => scanrip_run(&args[2], &args[3]),
        "memread" => memread_run(&args[2], &args[3]),
        "gametype_names" => gametype_names_run(&args[2], &args[3]),
        other => {
            eprintln!("unknown tool: {}", other);
            exit(2);
        }
    }
}
