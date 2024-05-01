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
ENGINE = MergeTree
PARTITION BY toYYYYMM(date)
ORDER BY (date)

nteger types: signed and unsigned integers (UInt8, UInt16, UInt32, UInt64, UInt128, UInt256, Int8, Int16, Int32, Int64, Int128, Int256)
Floating-point numbers: floats(Float32 and Float64) and Decimal values
Boolean: ClickHouse has a Boolean type
Strings: String and FixedString
Dates: use Date and Date32 for days, and DateTime and DateTime64 for instances in time
JSON: the JSON object stores a JSON document in a single column
UUID: a performant option for storing UUID values
Low cardinality types: use an Enum when you have a handful of unique values, or use LowCardinality when you have up to 10,000 unique values of a column
Arrays: any column can be defined as an Array of values
Maps: use Map for storing key/value pairs
Aggregation function types: use SimpleAggregateFunction and AggregateFunction for storing the intermediate status of aggregate function results
Nested data structures: A Nested data structure is like a table inside a cell
Tuples: A Tuple of elements, each having an individual type.
Nullable: Nullable allows you to store a value as NULL when a value is "missing" (instead of the column settings its default value for the data type)
IP addresses: use IPv4 and IPv6 to efficiently store IP addresses
Geo types: for geographical data, including Point, Ring, Polygon and MultiPolygon
Special data types: including Expression, Set, Nothing and Interval

-- {"kind":"chat","nickname":"PCUser013","realUsername":"PCUser013","id":7552,"message":"schroedingers attack","registered":true,"location":"page","op":false,"admin":false,"staff":false,"color":"#8294b8","date":1714078930587}
