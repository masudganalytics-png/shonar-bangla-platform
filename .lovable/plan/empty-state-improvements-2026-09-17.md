# Empty-state improvements

## Scope
- Hide each data-backed homepage section after loading when its underlying result set is empty, while preserving existing loading and populated states.
- Keep the current empty messages on Teachers, Business Directory, Blood Donors, and KHIJIRION Match, and add one prominent Bangla button linking to each existing registration/request route.
- Do not change data access, routes, authentication, security, branding, navigation, or unrelated UI.

## Existing routes to use
- Teachers: `/teachers/register`
- Business: `/business/register`
- Blood donors: `/blood-donors/register`
- Match request: `/match/new`

## Verification
- Run TypeScript typecheck and production build.
- Open the homepage and four affected listing pages to check for rendering or console errors and confirm route targets remain unchanged.
