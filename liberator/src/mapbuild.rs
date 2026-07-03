use crate::gen::BUILD_NAMES;

fn ends_with_num(name: &str, num: &str) -> bool {
    let ln = name.len();
    let lnum = num.len();
    if ln < lnum + 1 {
        return false;
    }
    if name.as_bytes()[ln - lnum - 1] != b'_' {
        return false;
    }
    &name[ln - lnum..] == num
}

pub fn engine_map_build(scanned: &str) -> &'static str {
    let num = match scanned.rfind('_') {
        Some(i) => &scanned[i + 1..],
        None => scanned,
    };
    for &b in BUILD_NAMES {
        if ends_with_num(b, num) {
            return b;
        }
    }
    "None"
}
