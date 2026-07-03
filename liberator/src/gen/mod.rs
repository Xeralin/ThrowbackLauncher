#![allow(dead_code)]
#![allow(non_upper_case_globals)]

pub struct FeatureChain {
    pub feature: &'static str,
    pub build: &'static str,
    pub base_offset: u64,
    pub module_index: i32,
    pub offsets: &'static [i32],
}

pub struct ShadowRegion {
    pub offset: u64,
    pub patch: &'static [u8],
}

pub struct ShadowSeason {
    pub season: &'static str,
    pub regions: &'static [ShadowRegion],
}

pub struct TreeParams {
    pub build: &'static str,
    pub root_base: u64,
    pub root_offs: &'static [i32],
    pub name_off: i32,
    pub stride: i32,
    pub children_off: i32,
    pub root_count: i32,
    pub i_mp: i32,
    pub i_th: i32,
    pub i_situ: i32,
    pub i_mm: i32,
    pub i_gym: i32,
    pub i_vr: i32,
    pub i_ob: i32,
    pub situ_adv: i32,
    pub event_mode: &'static str,
    pub remove: &'static [i32],
}

include!(concat!(env!("CARGO_MANIFEST_DIR"), "/gen/builds_data.rs"));
include!(concat!(env!("CARGO_MANIFEST_DIR"), "/gen/patches_data.rs"));
include!(concat!(env!("CARGO_MANIFEST_DIR"), "/gen/build_season.rs"));
include!(concat!(env!("CARGO_MANIFEST_DIR"), "/gen/feature_chains.rs"));
include!(concat!(env!("CARGO_MANIFEST_DIR"), "/gen/is_ready.rs"));
include!(concat!(env!("CARGO_MANIFEST_DIR"), "/gen/season_names.rs"));
include!(concat!(env!("CARGO_MANIFEST_DIR"), "/gen/tree_params.rs"));
include!(concat!(env!("CARGO_MANIFEST_DIR"), "/gen/gametype_names.rs"));
include!(concat!(env!("CARGO_MANIFEST_DIR"), "/gen/feature_values.rs"));
include!(concat!(env!("CARGO_MANIFEST_DIR"), "/gen/shadow_regions.rs"));
