# Browser QA record

The live development preview was tested end to end with non-personal sample data. The VVLF logo rendered from durable project storage in the identity rail, with no broken-image fallback.

The form accepted applicant details, switched successfully into the Tech & Web question branch, enforced a selected capability, required a working-style answer, and showed the final goal, workstation, and consent controls. The completed sample submission reached the custom VVLF thank-you screen and confirmed the selected Tech & Web track.

The default is the custom VVLF thank-you screen. After the redirect test, the blank default was restored and a separate non-personal sample was submitted; it displayed the branded “Thank you for applying” screen for the selected Design & Visuals track without navigating away. The optional redirect path was also tested by temporarily setting `POST_SUBMISSION_REDIRECT_URL` to a valid public HTTPS URL, submitting a non-personal sample, and confirming that the browser navigated to the configured destination after saving. Configure `POST_SUBMISSION_REDIRECT_URL` in `client/src/pages/Home.tsx` with the final full `https://` URL when VVLF is ready to redirect applicants. All non-personal test records were removed from the applications table after verification.

## Administration and enhanced form controls

The public form was rechecked with the updated progress treatment. It initially showed **12 required prompts remaining**, dropped to **7** after five profile fields were completed, and dropped to **6** after the study-year selection. The VVLF logo remained clearly visible. The `/admin` route displayed the existing secure sign-in gate in an unauthenticated browser session; a Vitest test separately verifies that a signed-in non-administrator receives `FORBIDDEN` from the application-list procedure.

The full applicant flow was then tested with non-personal data. The remaining-prompt counter reached **0** only after the mandatory privacy-notice checkbox was selected. Submission without this consent was blocked with the expected consent-validation message. After accepting consent and submitting, the browser redirected successfully to `https://vishnuventurelabs.com/`. The temporary verification row was deleted from the applications table.

## Owner-session administrator verification

The missing `users` table was created after an owner sign-in attempt surfaced the database error. The owner session then completed successfully and opened the protected `/admin` panel, showing the authenticated VVLF reviewer workspace, search control, CSV export control, and zero-submission state. A non-personal application is now being used to complete the authenticated table, sorting, filtering, and export checks before being removed.

The non-personal authenticated workflow sample uses the clearly labelled name **Admin Panel Test** and the email `admin.panel.test@example.com`; it will be deleted after browser verification.

The sample completed the Tech & Web track, selected Git & GitHub, chose Debug line-by-line, selected a primary goal and personal-laptop access, and accepted the privacy notice. The form showed **0 required prompts remaining** before the verification submission.

After the configured redirect completed, the authenticated `/admin` panel loaded the submitted sample in its table alongside the existing real application. Search narrowed the table to **Admin Panel Test**, clearing the filter restored both rows, and the Applicant header changed to ascending sort with the expected alphabetical ordering. CSV serialization is covered by an automated test; the UI Export CSV button exports exactly the currently filtered rows. The non-personal Admin Panel Test application was then deleted, while the pre-existing real record was retained.

## Supplied visual asset refresh

The supplied student workspace photograph and circular VVLF symbol were uploaded to durable project storage and substituted into the public application form. Desktop verification confirmed the circular logo in the identity rail and the student-workspace image in the lower rail visual; mobile verification confirmed that the resized circular logo remains prominent, undistorted, and legible. The full Vitest suite passed (**5 files / 8 tests**) and TypeScript completed with no errors after this refresh.

The logo placement was then corrected at the user’s direction: the original full VVLF logo was restored in the main identity rail, while the supplied circular VVLF symbol now replaces the lone V mark in the caption directly beneath the student workspace image. Desktop visual verification confirmed this exact arrangement, with all 8 automated tests and TypeScript validation passing afterward.

The caption was enhanced into an accessible external link to `https://vishnuventurelabs.com/`, containing the supplied circular logo, the student-focused message **“Turn curiosity into your next build. Explore VVLF.”**, and a visible external-link indicator. The circular logo scales and rotates subtly on hover or keyboard focus, with a focus ring for keyboard users. Desktop visual verification confirms the complete affordance, and the full suite remains green (**5 files / 8 tests**).

The caption now opens an accessible **About VVLF** modal before a user chooses to leave the application. The modal uses the public VVLF website’s own positioning, outlines idea validation, prototyping, and mentorship, and provides a deliberate **Explore VVLF** link to the official site. With the project’s existing Umami script, anonymous `vvlf_caption_opened` and `vvlf_website_visit` events are recorded with the placement `student_image_caption`; no applicant information is included. The caption analytics helper is covered by two new Vitest tests. Desktop verification confirmed the updated caption affordance, while all checks passed (**6 files / 10 tests**, TypeScript clean).

Runtime verification confirmed that the preview renders the configured Umami endpoint and website identifier. A browser-level interaction test opened the caption modal, confirmed its VVLF content, verified the `vvlf_caption_opened` event payload, and intercepted the deliberate **Explore VVLF** action to confirm its `https://vishnuventurelabs.com/` target and the `vvlf_website_visit` event payload. The modal remains open only until the user elects to continue the application or visit the official website.

## Separate multi-owner Form Studio

The reusable Form Studio is isolated from the VVLF product through its own `/studio` owner workspace and `/forms/:slug` public-form route family; the existing VVLF form and `/admin` application review workflow remain unchanged. Form, question, and response records are modeled separately, and all owner-side queries and mutations scope forms and response access to the signed-in owner. A temporary, clearly labeled non-personal published form was browser-tested: it rendered as a standalone public form, accepted a non-personal response, displayed its configured success message, and then had its form, questions, and response removed. The studio route correctly exposes a sign-in gate without authentication. The current suite passes **7 files / 12 tests**, and TypeScript is clean.

The complete authenticated owner workflow was then verified in the connected owner browser: a non-personal form was created, the nested editor route was corrected, the form was published, its public link accepted a required-consent response, and the response appeared in the owner-only response workspace. The non-personal form, its questions, and its response were removed immediately afterward. An automated owner-isolation test confirms that the router passes the authenticated owner ID into the data query and returns `NOT_FOUND` for a second owner; the final suite passes **8 files / 14 tests**, with TypeScript clean.
