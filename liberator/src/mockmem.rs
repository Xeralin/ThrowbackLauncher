pub fn mock_read8(mut x: u64) -> u64 {
    x = x.wrapping_add(0x9E3779B97F4A7C15);
    x = (x ^ (x >> 30)).wrapping_mul(0xBF58476D1CE4E5B9);
    x = (x ^ (x >> 27)).wrapping_mul(0x94D049BB133111EB);
    x ^ (x >> 31)
}

pub fn mock_read_bytes(addr: u64, buf: &mut [u8]) {
    for i in 0..buf.len() as u64 {
        buf[i as usize] = (mock_read8(addr.wrapping_add(i & !7u64)) >> (8 * (i & 7))) as u8;
    }
}
