-- Run me to prepare Clickhouse for large-scale OWOT logging!

use database owot_chat_log;
create table chat_message (
    date DateTime64(3, 'UTC') PRIMARY KEY CODEC(DoubleDelta, ZSTD(5)),
    nickname String CODEC(ZSTD(5)),
    realUsername String CODEC(ZSTD(5)),
    id UInt32,
    message String CODEC(ZSTD(5)),
    registered Boolean,
    location Enum('page' = 1, 'global' = 2),
    op Boolean,
    admin Boolean,
    staff Boolean,
    color String,
    privateMessage Nullable(Enum8('' = 1, 'from_me' = 2, 'to_me' = 3)),

    -- bot specific meta fields --
    world String,
    sentByBot Boolean,
    metadataJson JSON,
)
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date);

create table lastseen_optin (
    id UInt32 PRIMARY KEY,
    realUsername String CODEC(ZSTD(5)),
    optin Boolean
)
ENGINE = MergeTree
ORDER BY (id);

CREATE INDEX idx_lastseen_optin ON lastseen_optin (
    realUsername ASC
);

