-- Populate the last_seen_dates table.

CREATE TABLE owot_chat_log.last_seen_dates
PRIMARY KEY realUsername
AS SELECT
    realUsername,
    max(date) AS last_seen_date
FROM owot_chat_log.chat_message
GROUP BY realUsername
