-- user_account for those that choose to use them
CREATE TABLE user_account (
    user_account_id     serial          PRIMARY KEY,
    username            varchar(254)    NOT NULL UNIQUE,
    hashed_password     varchar(255)    NOT NULL
);

INSERT INTO user_account (username, hashed_password)
    VALUES ('tommyboy1964', 'THISISNOTAREALHASHEDPW')
;

