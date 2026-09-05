# Public Route Contract

## Browser Routes

| Route              | Purpose             | Valid result                                                            | Invalid result                               |
| ------------------ | ------------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| `/`                | Tower catalogue     | Localized searchable list of all active towers                          | Not applicable                               |
| `/towers/:towerId` | Stable tower detail | Selected tower and only its eligible banners, grouped by classification | Localized not-found state with a link to `/` |
| `/:pathMatch(.*)*` | Client catch-all    | Not applicable                                                          | Localized not-found state with a link to `/` |

`towerId` must satisfy `^[a-z0-9]+(?:-[a-z0-9]+)*$` before lookup. A
syntactically valid but unknown ID and a malformed ID have the same safe
not-found presentation. Route values are rendered only as text and are never
inserted as HTML.

Search values remain local view state for the first release. Clearing a query or
entering whitespace restores the full route-specific dataset and never changes
the browser path.

## Static Resource Routes

| Path                                  | Behavior                                                      |
| ------------------------------------- | ------------------------------------------------------------- |
| `/assets/*`                           | Serve fingerprinted Vite assets; never rewrite.               |
| `/release.json`                       | Serve the promoted build metadata with revalidation.          |
| Content JSON emitted by Vite          | Serve the exact build input with revalidation; never rewrite. |
| A request containing a file extension | Return the origin result; never rewrite to application HTML.  |

## CloudFront Viewer-Request Contract

For `GET` or `HEAD` requests only:

1. Preserve `/` as `/index.html` at the private origin.
2. Rewrite `/towers/<stable-id>` and an optional trailing slash to `/index.html`.
3. Rewrite any other extensionless path to `/index.html` so the application can
   render its localized catch-all state.
4. Do not rewrite paths containing a final filename extension or paths under
   `/assets/`.
5. Preserve the public browser URL; the rewrite is internal to CloudFront.

The function must not redirect unknown route values, disclose S3 keys, or turn a
missing static resource into a successful HTML response.

## Direct-Load Acceptance Examples

| Request                                                   | Expected response                                                                               |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `GET https://nordhold.asperntallow.de/`                   | HTTPS `200`, application shell, catalogue view.                                                 |
| `GET https://nordhold.asperntallow.de/towers/arc-tower`   | HTTPS `200`, application shell, resolved detail when the accepted dataset contains `arc-tower`. |
| `GET https://nordhold.asperntallow.de/towers/not-a-tower` | HTTPS `200`, application shell, localized not-found view.                                       |
| `GET https://nordhold.asperntallow.de/assets/missing.js`  | Origin error such as `404`; no application-shell rewrite.                                       |
| `GET http://nordhold.asperntallow.de/`                    | Redirect to the equivalent HTTPS URL.                                                           |

The smoke test selects its valid tower ID from the built content manifest rather
than assuming a historical ID.
