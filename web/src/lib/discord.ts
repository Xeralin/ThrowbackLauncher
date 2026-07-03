type InviteCounts = {
  members: number | null;
  presence: number | null;
};

export async function fetchInviteCounts(invite: string): Promise<InviteCounts> {
  try {
    const res = await fetch(
      `https://discord.com/api/v10/invites/${invite}?with_counts=true`,
    );
    if (!res.ok) return { members: null, presence: null };
    const data = await res.json();
    return {
      members:
        typeof data.approximate_member_count === "number"
          ? data.approximate_member_count
          : null,
      presence:
        typeof data.approximate_presence_count === "number"
          ? data.approximate_presence_count
          : null,
    };
  } catch {
    return { members: null, presence: null };
  }
}
