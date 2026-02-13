# API input validation

## General

- Validate type, format, and bounds.
- Reject unknown fields when possible.
- Enforce max lengths to prevent abuse.

## Node

- Use schema validation (e.g., Zod / Joi) consistently at boundaries.

## Java

- Use Bean Validation (`jakarta.validation`) at request DTO boundaries.
- Validate both path/query and body.
