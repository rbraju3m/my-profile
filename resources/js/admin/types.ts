export type AdminShared = {
    auth: { name: string; email: string } | null;
    unreadMessages: number;
    flash: { success: string | null; warning: string | null; status: string | null };
    errors: Record<string, string>;
};

export type SelectOption = { value: string; label: string; group?: string };
