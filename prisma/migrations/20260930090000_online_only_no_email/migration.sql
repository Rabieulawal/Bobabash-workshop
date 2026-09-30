-- Online-only workshops + no email delivery.
-- Drops the in-person event type, venue/location data and every column that
-- only existed to track transactional email delivery.

-- Workshop: remove location + event-type fields
ALTER TABLE "Workshop" DROP COLUMN "location";
ALTER TABLE "Workshop" DROP COLUMN "format";

-- Workshop: remove email-delivery bookkeeping
ALTER TABLE "Workshop" DROP COLUMN "meetingUrlAddedAt";
ALTER TABLE "Workshop" DROP COLUMN "remindersSentAt";

-- Registration: remove email-delivery bookkeeping
ALTER TABLE "Registration" DROP COLUMN "notifiedAt";

-- The enum only existed to distinguish online from in-person workshops
DROP TYPE "WorkshopFormat";
