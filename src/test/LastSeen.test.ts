import { ChatDB } from "../Database";
import { LastSeen } from "../LastSeen";
import { getCredentials } from "./lib/creds";

/* Test that Jest itself works, duh. */
describe('LastSeen', () => {
    const db = new ChatDB(getCredentials());
    const ls = new LastSeen({ db });

    test(`Consent status for non-existent users is true (optin by default)`,
        async () => {
            expect(await ls.consent("Nonexistent01")).toBe(true);
        }
    );
    test(`Consent status for existent users returns something`,
        async () => {
            const result = await ls.consent("FakeUser001");
            expect([true, false].includes(result)).toBe(true);
        }
    );
});