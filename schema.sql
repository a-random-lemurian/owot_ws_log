BEGIN TRANSACTION;

CREATE TABLE msg (
    id INTEGER PRIMARY KEY NOT NULL,
    msg_json TEXT,
    metadata_json TEXT,
    world TEXT
);

CREATE VIEW chat_table AS
SELECT
    msg_json->>'$.kind' as kind,
    msg_json->>'$.nickname' as nickname,
    msg_json->>'$.realUsername' as realUsername,
    msg_json->>'$.id' as id,
    msg_json->>'$.message' as message,
    msg_json->>'$.registered' as registered,
    msg_json->>'$.location' as location,
    msg_json->>'$.op' as op,
    msg_json->>'$.admin' as admin,
    msg_json->>'$.staff' as staff,
    msg_json->>'$.color' as color,
    msg_json->>'$.date'as timestamp_unix_ms,
    world as world,
    metadata_json->>'$.msg_json_sha256' as sha256_base64,

    -- The received field is in the timestamp of whoever's running it
    -- This field is deprecated
    -- metadata_json->>'$.received' as received
FROM msg;

COMMIT;