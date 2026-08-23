# Form Studio product boundary

## Purpose

**Form Studio** is a reusable, multi-owner form-building product. It is intentionally separate from the existing VVLF student application: VVLF remains a dedicated public product with its current route, submission model, review workspace, branding, and analytics.

Form Studio will operate under its own route family:

| Area | Route family | Audience | Data boundary |
| --- | --- | --- | --- |
| Owner workspace | `/studio` | Signed-in form owners | Forms and responses owned by the current user only |
| Public forms | `/forms/:slug` | Anyone with the form link | Published form definition only; no owner workspace access |
| VVLF product | `/` and `/admin` | VVLF applicants and VVLF administrators | Existing VVLF application and `applications` data remain unchanged |

## First release

The first Form Studio release will let an authenticated owner create a form from a starter structure, configure its title, description, published state, success message, and optional redirect, add reusable question types, preview the public experience, publish a unique link, and inspect/export only that form's responses.

## Ownership and privacy

Every form belongs to one signed-in owner. Server procedures must scope reads, edits, response access, and exports to the current user’s identifier. Public submissions will be associated with a published form only; no applicant data will be used for analytics events.

## Starter question types

| Type | Use case |
| --- | --- |
| Short text | Names, titles, identifiers |
| Long text | Open-ended answers |
| Email | Contact details with email validation |
| Phone | Contact details with phone-friendly input |
| Single choice | One option from a defined list |
| Multiple choice | One or more options from a defined list |
| Consent | Required privacy or terms acknowledgement |
