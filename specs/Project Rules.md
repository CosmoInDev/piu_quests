# Project Rules

This ruleset must be referenced and followed when working on any commands or features in this project.

---

## 1. Frontend language (Korean)

- **Users are all Korean.** All user-facing text in the frontend must be written in Korean.
- Apply to: UI labels, buttons, placeholders, error messages, empty states, tooltips, and any text visible to end users.
- Do not ship user-facing strings in English unless they are proper nouns or agreed exceptions.

---

## 2. Frontend Design

- Colors
  - Background color: #FCF7F8
  - Primary color: #A31621
  - Secondary color: #90C2E7
- Use shadcn/ui when using components for design. https://ui.shadcn.com/

---

## 3. Backend testing

- **For every feature added on the backend, decent test code is required.**
- New or changed backend behavior must be covered by tests (unit and/or integration as appropriate).
- Tests should be clear, maintainable, and sufficient to catch regressions. Avoid trivial or purely cosmetic tests.
- Please do not test 'how many times the method is called', unless it is impossible to test via unit test(like repository, etc).

---
