import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServerApp } from "./index.js";

let directory;
let server;
let base;

before(async () => {
  directory = mkdtempSync(join(tmpdir(), "pathwise-test-"));
  server = createServerApp({ dbPath: join(directory, "test.sqlite") });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  rmSync(directory, { recursive: true, force: true });
});

test("new account can sign in and save account progress without private check-ins", async () => {
  const register = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Riya Shah", email: "riya@example.com", password: "correct-horse-123" }),
  });
  assert.equal(register.status, 201);
  const cookie = register.headers.get("set-cookie").split(";")[0];
  assert.match(register.headers.get("set-cookie"), /HttpOnly/);
  assert.match(register.headers.get("set-cookie"), /SameSite=Lax/);
  assert.equal((await register.json()).user.name, "Riya Shah");

  const saved = await fetch(`${base}/api/state`, {
    method: "PUT",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ tasks: [{ title: "Mock review" }], interests: ["design"], checkins: [{ stress: 9 }] }),
  });
  assert.equal(saved.status, 200);
  const loaded = await fetch(`${base}/api/state`, { headers: { cookie } });
  assert.deepEqual(await loaded.json(), { tasks: [{ title: "Mock review" }], interests: ["design"] });
});

test("account progress is inaccessible without signing in", async () => {
  const response = await fetch(`${base}/api/state`);
  assert.equal(response.status, 401);
});

test("password login restores the saved account", async () => {
  const response = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "RIYA@example.com", password: "correct-horse-123" }),
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.email, "riya@example.com");
  const badPassword = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "riya@example.com", password: "wrong-password" }),
  });
  assert.equal(badPassword.status, 401);
});

test("registration validates password length and rejects duplicate email", async () => {
  const short = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Test User", email: "test@example.com", password: "short" }),
  });
  assert.equal(short.status, 400);
  const duplicate = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Riya Shah", email: "RIYA@example.com", password: "another-password" }),
  });
  assert.equal(duplicate.status, 409);
});

test("registration accepts ordinary email addresses containing the letter s", async () => {
  const response = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Krish Sethi", email: "krishsethi2005@gmail.com", password: "a-long-password-123" }),
  });
  assert.equal(response.status, 201);
});
