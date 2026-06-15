
# Assignment: Extensive Unit Tests for LTI Candidate Insertion Feature

## Your Role
You are a senior software engineer specializing in unit testing and quality assurance. You have deep expertise in Jest, TypeScript, TDD methodologies, and backend API testing. Your standard is not to chase code coverage numbers — your goal is to thoroughly validate **functional behavior**: every meaningful thing the system can do, every way it can succeed, and every way it can fail.

## Context
You are working on the AI4Devs LTI project — an ATS (Applicant Tracking System). The repository has already been forked, cloned, and Jest is configured (AI4Devs-tdd base repo).

The feature under test is **candidate insertion**: accepting candidate data (from a web form or API), validating it, and persisting it to the database via Prisma. This is a critical data path — correctness and resilience matter far more than any coverage percentage.

## Your Mission

### 1. Explore the Project First
Before writing a single test, deeply explore the codebase:
- Map out `backend/src/` — all routes, controllers, services, and repositories related to candidates
- Read the Prisma schema (`schema.prisma`) to understand every field, its type, whether it's required/optional, and any constraints
- Identify validation logic — where does it live? What rules does it enforce?
- Understand the full request lifecycle: HTTP request → controller → service → Prisma → response
- Note any error handling patterns already in place

This exploration is mandatory. The tests must reflect how the system **actually works**, not assumptions.

### 2. Create an Extensive Unit Test Suite

Create the file: `backend/src/tests/tests-CAZ.test.ts`

Write a thorough, functionality-driven Jest unit test suite. The goal is **not** to hit a coverage number. The goal is to prove that every meaningful functional scenario — positive and negative — is explicitly verified.

Think like a QA engineer stress-testing a critical API: what are all the things that should work? What are all the things that should fail gracefully? What edge cases exist?

---

#### Family 1 — Data Reception & Validation

**Positive cases (valid inputs that should succeed):**
- A fully populated valid candidate payload is accepted and returns a success response
- A payload with only required fields (all optional fields omitted) is accepted
- Fields with boundary-valid values (e.g., max-length strings, valid email formats) are accepted
- Candidate data with unicode characters in name fields is handled correctly

**Negative cases (invalid inputs that should be rejected):**
- Missing required field: `firstName`
- Missing required field: `lastName`
- Missing required field: `email`
- Invalid email format (e.g., `"notanemail"`, `"missing@"`, `"@nodomain.com"`)
- Field exceeding maximum allowed length
- Wrong data type for a field (e.g., number where string expected)
- Empty string `""` for a required field
- `null` value for a required field
- Entirely empty request body `{}`
- Extra/unknown fields in the payload (should be ignored or rejected — verify which)

---

#### Family 2 — Database Persistence

**Positive cases:**
- When valid data is received, `prisma.candidate.create` is called exactly once
- The correct fields and values are passed to `prisma.candidate.create` — no more, no less
- The service returns the newly created candidate object as returned by Prisma
- The HTTP response contains the created candidate with the correct status code

**Negative cases:**
- Prisma throws a unique constraint violation (duplicate email) — the system returns an appropriate conflict error, not a 500
- Prisma throws a generic database error — the system returns a 500 or appropriate error response and does not leak internal details
- Prisma returns `null` or `undefined` unexpectedly — the system handles it without crashing
- Database is unavailable (connection error simulated) — the system returns a meaningful error response

---

#### Edge Cases & Resilience
- The same valid request sent twice (idempotency behavior — should the second fail?)
- Concurrent insertion of the same candidate (if testable at unit level)
- Partial Prisma response (missing fields in the returned object) — system does not crash

---

### 3. Testing Standards to Apply

- **Mock Prisma completely**: Use `jest.mock()` to mock Prisma Client. The real database must never be touched. Follow: https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing
- **AAA pattern** (Arrange, Act, Assert) — every test must be structured this way
- **One concept per test** — do not assert multiple unrelated things in a single `it()` block
- **Descriptive naming** — `describe` blocks group by family/scenario; `it()` blocks read as plain English sentences describing the expected behavior
- **Reset mocks between tests** — use `beforeEach(() => jest.clearAllMocks())`
- **No test interdependency** — each test must be fully isolated and runnable alone
- **Meaningful assertions** — assert the actual behavior (status codes, response bodies, mock call arguments), not just that something didn't throw

## Hard Constraints
- Test file: `backend/src/tests/tests-CAZ.test.ts`
- Prompts file: `prompts/prompts-CAZ.md`
- PR must only include the two files above
- Never test against the real database — always mock Prisma
- Do not optimize for coverage — optimize for functional correctness and resilience
- Prompts file format must strictly use `# Prompt <number>:` headings

## Reference
- Prisma unit testing: https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing
```