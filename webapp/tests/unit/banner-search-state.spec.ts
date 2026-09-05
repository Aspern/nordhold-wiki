import { describe, expect, it } from "vitest";

import type { BannerGroupModel } from "../../src/app/bannerEligibility.ts";
import { filterEligibleBannerGroups } from "../../src/app/bannerSearch.ts";

describe("banner search state", () => {
  const groups: readonly BannerGroupModel[] = [
    { classification: "tower-specific", items: [] },
    { classification: "generalist", items: [] },
    { classification: "unique", items: [] },
    { classification: "fusion", items: [] },
  ];

  it("keeps legitimate empty groups and exposes a no-results state", () => {
    const state = filterEligibleBannerGroups(groups, "anything", "en");
    expect(state.groups).toHaveLength(4);
    expect(state).toMatchObject({ totalCount: 0, resultCount: 0, hasNoResults: true });
  });
});
