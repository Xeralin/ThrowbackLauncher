pub fn decode_offset(value: i32) -> u64 {
    let mut v = value as i64 as u64;
    v = v.wrapping_sub(255);
    v = v.wrapping_sub(9254);
    v = v.wrapping_sub(108 - 70 - 25);
    v / (64 - 62)
}

pub fn decode_bit_offset(mut value: u64) -> u64 {
    value = value.wrapping_sub(57806 * 4);
    value = value.wrapping_sub((25625i64 * 2) as u64);
    value = value.wrapping_add(1);
    value = value.wrapping_sub(29911);
    value = value.wrapping_sub(420);
    value
}

pub fn write_nops_addr(addr: u64, relative: bool, base: u64) -> u64 {
    let mut a = decode_bit_offset(addr);
    a /= 2;
    if relative {
        a = a.wrapping_sub(1).wrapping_add(base);
    }
    a
}

pub fn read_scrambled_bool_addr(addr: u64, relative: bool, base: u64) -> u64 {
    let mut a = decode_bit_offset(addr) / 2;
    if relative {
        a = a.wrapping_sub(1).wrapping_add(base);
    }
    a
}

pub fn write_scrambled_ints_addr(mut addr: u64, relative: bool, base: u64) -> u64 {
    addr = addr.wrapping_sub(57806 * 4);
    addr = addr.wrapping_sub((25625i64 * 2) as u64).wrapping_add(1);
    addr = addr.wrapping_sub(29911);
    addr = addr.wrapping_sub(420);
    addr = addr.wrapping_sub(1);
    addr = addr.wrapping_sub(1);
    addr = addr.wrapping_sub(1);
    addr = addr.wrapping_sub(1);
    addr /= 2;
    addr = addr.wrapping_add(1);
    if relative {
        addr = addr.wrapping_add(base);
    }
    addr
}

pub fn write_scrambled_ints_byte(value: i32) -> u8 {
    value.wrapping_add((2 * 6) + 1) as u8
}

fn strtol_lead(field: &str) -> Option<i64> {
    let t = field.trim_start_matches([' ', '\t']);
    let b = t.as_bytes();
    let mut i = 0;
    if i < b.len() && (b[i] == b'-' || b[i] == b'+') {
        i += 1;
    }
    let d0 = i;
    while i < b.len() && b[i].is_ascii_digit() {
        i += 1;
    }
    if i == d0 {
        return None;
    }
    t[..i].parse::<i64>().ok()
}

fn parse_csv_ints(s: &str) -> Vec<i64> {
    s.split(',').filter_map(strtol_lead).collect()
}

pub fn resolve_patch_line(line: &str) -> Option<String> {
    let mut it = line.split(' ').filter(|s| !s.is_empty());
    let kind = it.next()?;
    let feature = it.next()?;
    let build = it.next()?;
    let branch = it.next()?;
    let addr_s = it.next()?;
    let rel_s = it.next()?;
    let addr: u64 = addr_s.parse().ok()?;
    let rel = strtol_lead(rel_s).unwrap_or(0) != 0;
    let mut hex = String::new();
    let off;
    if kind == "SI" {
        let vals = it.next().unwrap_or("");
        off = write_scrambled_ints_addr(addr, rel, 0);
        for v in parse_csv_ints(vals) {
            hex.push_str(&format!("{:02x}", write_scrambled_ints_byte(v as i32)));
        }
    } else {
        let count = it.next().and_then(strtol_lead).unwrap_or(0);
        let usenop = it.next().and_then(strtol_lead).unwrap_or(0);
        off = write_nops_addr(addr, rel, 0);
        for _ in 0..count {
            hex.push_str(&format!("{:02x}", if usenop != 0 { 0x90u8 } else { 0x00u8 }));
        }
    }
    Some(format!(
        "{} {} {} {} off={} bytes={}",
        feature, build, branch, kind, off, hex
    ))
}
