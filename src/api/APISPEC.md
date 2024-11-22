# owot_ws_log API specification

Assume that all header names are prefixed with `/api/v1`.

As used in this document, "parameters" refer to `key=value` pairs, separated by a question mark (`?`) from the endpoint URL such as `/approval?favoriteAdmin=fern`.

### GET /count
The `/count` endpoint returns the total count of messages logged by owot_ws_log.

*No parameters.*

### GET /messages
The `/messages` endpoint returns messages in the database.

***Parameters***
- `query`: The query string to search for in the database.
- `pageSize`: The number of messages to retrieve from the database. Maximum is 1,000.
