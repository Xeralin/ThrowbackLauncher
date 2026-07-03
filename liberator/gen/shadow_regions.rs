pub static SR_Y6S2_North_Star: &[ShadowRegion] = &[
    ShadowRegion { offset: 34194451, patch: &[233, 218, 0, 0, 0] },
];
pub static SR_Y7S1_Demon_Veil: &[ShadowRegion] = &[
    ShadowRegion { offset: 38908722, patch: &[104] },
];
pub static SR_Y7S2_Vector_Glare: &[ShadowRegion] = &[
    ShadowRegion { offset: 70891833, patch: &[65, 177, 138, 144] },
    ShadowRegion { offset: 70891682, patch: &[233, 146, 0, 0, 0] },
    ShadowRegion { offset: 386998, patch: &[176, 0] },
    ShadowRegion { offset: 387014, patch: &[176, 0] },
    ShadowRegion { offset: 387035, patch: &[176, 0] },
];
pub static SR_Y7S4_Solar_Raid: &[ShadowRegion] = &[
    ShadowRegion { offset: 31939975, patch: &[179, 0, 235, 124] },
    ShadowRegion { offset: 28347181, patch: &[179, 0, 235, 123] },
    ShadowRegion { offset: 86200204, patch: &[144, 144, 144, 144, 233] },
    ShadowRegion { offset: 28554354, patch: &[179, 0, 144, 235, 122] },
    ShadowRegion { offset: 28385078, patch: &[179, 0, 144, 235, 122] },
    ShadowRegion { offset: 31990087, patch: &[179, 0, 235, 124] },
    ShadowRegion { offset: 32268965, patch: &[176, 0] },
    ShadowRegion { offset: 32268981, patch: &[176, 0] },
];
pub static SHADOW_SEASONS: &[ShadowSeason] = &[
    ShadowSeason { season: "Y6S2_North_Star", regions: SR_Y6S2_North_Star },
    ShadowSeason { season: "Y7S1_Demon_Veil", regions: SR_Y7S1_Demon_Veil },
    ShadowSeason { season: "Y7S2_Vector_Glare", regions: SR_Y7S2_Vector_Glare },
    ShadowSeason { season: "Y7S4_Solar_Raid", regions: SR_Y7S4_Solar_Raid },
];
