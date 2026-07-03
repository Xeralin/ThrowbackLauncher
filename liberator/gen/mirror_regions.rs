pub static MR_Y6S2_North_Star: &[MirrorRegion] = &[
    MirrorRegion { offset: 34194451, bytes: &[233, 218, 0, 0, 0] },
];
pub static MR_Y7S1_Demon_Veil: &[MirrorRegion] = &[
    MirrorRegion { offset: 38908722, bytes: &[104] },
];
pub static MR_Y7S2_Vector_Glare: &[MirrorRegion] = &[
    MirrorRegion { offset: 70891833, bytes: &[65, 177, 138, 144] },
    MirrorRegion { offset: 70891682, bytes: &[233, 146, 0, 0, 0] },
    MirrorRegion { offset: 386998, bytes: &[176, 0] },
    MirrorRegion { offset: 387014, bytes: &[176, 0] },
    MirrorRegion { offset: 387035, bytes: &[176, 0] },
];
pub static MR_Y7S4_Solar_Raid: &[MirrorRegion] = &[
    MirrorRegion { offset: 31939975, bytes: &[179, 0, 235, 124] },
    MirrorRegion { offset: 28347181, bytes: &[179, 0, 235, 123] },
    MirrorRegion { offset: 86200204, bytes: &[144, 144, 144, 144, 233] },
    MirrorRegion { offset: 28554354, bytes: &[179, 0, 144, 235, 122] },
    MirrorRegion { offset: 28385078, bytes: &[179, 0, 144, 235, 122] },
    MirrorRegion { offset: 31990087, bytes: &[179, 0, 235, 124] },
    MirrorRegion { offset: 32268965, bytes: &[176, 0] },
    MirrorRegion { offset: 32268981, bytes: &[176, 0] },
];
pub static MIRROR_SEASONS: &[MirrorSeason] = &[
    MirrorSeason { season: "Y6S2_North_Star", regions: MR_Y6S2_North_Star },
    MirrorSeason { season: "Y7S1_Demon_Veil", regions: MR_Y7S1_Demon_Veil },
    MirrorSeason { season: "Y7S2_Vector_Glare", regions: MR_Y7S2_Vector_Glare },
    MirrorSeason { season: "Y7S4_Solar_Raid", regions: MR_Y7S4_Solar_Raid },
];
