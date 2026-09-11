-- AlterTable
ALTER TABLE "location" ADD COLUMN     "name" VARCHAR(200);

-- AlterTable
ALTER TABLE "shipment" ADD COLUMN     "total_co2_emission_g" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "chat_session" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3),

    CONSTRAINT "chat_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message" (
    "id" SERIAL NOT NULL,
    "chat_session_id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_session_session_id_key" ON "chat_session"("session_id");

-- AddForeignKey
ALTER TABLE "chat_session" ADD CONSTRAINT "chat_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_chat_session_id_fkey" FOREIGN KEY ("chat_session_id") REFERENCES "chat_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
