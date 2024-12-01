# owot_ws_log API specification

Assume that all header names are prefixed with `/api/v1`.

As used in this document, "parameters" refer to `key=value` pairs, separated by a question mark (`?`) from the endpoint URL such as `/approval?favoriteAdmin=fern`.

### GET /count
The `/count` endpoint returns the total count of messages logged by owot_ws_log.

*No parameters.*

### GET /messages
The `/messages` endpoint returns messages in the database.

***Parameters***
- `query`: Optional. The query string to search for in the database.
- `pageSize`: Optional. The number of messages to retrieve from the database. Maximum is 1,000.
- `before`: Optional. Used for pagination. The date after which to stop retrieving messages. This is automatically set to the current time of the request internally when the before parameter is not supplied.
- `realUsername`: Optional. A list of Uvias account usernames whose messages should be queried. Multiple names may be supplied, separated by semicolons, 

If no parameters are supplied, the endpoint will return the 100 most recent messages by default.

### GET /daily_messages
The `/daily_messages/YEAR/MONTH/DAY` endpoint returns messages sent on a particular day, UTC.

***Path elements***
- YEAR: The year of the date to look up.
- MONTH: The month of the date to look up.
- DAY: The day number within the month of the date to look up.



### GET /available_days
The `/available_days` endpoint returns per-day message counts. Use this with the `/daily_messages` endpoint to determine which days are available.

*No parameters.*
