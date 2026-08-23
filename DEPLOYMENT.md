# Deploying the VVLF application form

## What is ready

The project is a public, mobile-responsive VVLF application form. Its logo is loaded from durable project storage, submissions are validated on the server and saved to the project database, and applicants receive a custom thank-you screen after a successful submission.

## Publish the live site

Open the project’s Management panel, create the final checkpoint, and then select **Publish**. The published project receives a hosted URL that can be shared with applicants. A custom domain can subsequently be connected through **Settings → Domains**.

## Thank-you screen or redirect

Applicants now see a confirmed VVLF submission state briefly and then redirect to `https://vishnuventurelabs.com/`. This is controlled by `POST_SUBMISSION_REDIRECT_URL` near the top of `client/src/pages/Home.tsx`. Leave the value empty to retain the custom VVLF thank-you screen without navigation.

## Application administration

The reviewer workspace is available at `/admin`. It requires sign-in and the `admin` role; the project owner's account is automatically assigned this role. From the panel, authorized reviewers can search applications, sort by submitted date, applicant, college, or track, and export the currently filtered list as CSV.

## Response handling

All successful submissions are stored in the `applications` database table. Before publishing, VVLF should confirm its privacy notice, the reviewers who may access submissions, and the response-retention period. The current project does not send data to third-party forms, spreadsheets, or messaging services.
