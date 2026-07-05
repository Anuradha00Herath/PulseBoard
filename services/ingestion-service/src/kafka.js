import { Kafka } from "kafkajs";

export const TOPIC = "pulseboard.events";
export const NUM_PARTITIONS = 6;

const kafka = new Kafka({
  clientId: "ingestion-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

// enableIdempotence dedupes producer-side retries (network blips), distinct
// from the consumer-side event_id dedup aggregation-service adds in Sprint 3 —
// see docs/sprint2-design.md #2. Both are needed for FR6's exactly-once goal.
const producer = kafka.producer({ idempotent: true });
const admin = kafka.admin();

export async function ensureTopic() {
  await admin.connect();
  try {
    await admin.createTopics({
      topics: [{ topic: TOPIC, numPartitions: NUM_PARTITIONS }],
    });
  } finally {
    await admin.disconnect();
  }
}

export async function connectProducer() {
  await producer.connect();
}

export async function publishEvents(envelopes) {
  await producer.send({
    topic: TOPIC,
    acks: -1, // 'all' — every in-sync replica must ack before this resolves
    messages: envelopes.map((envelope) => ({
      key: envelope.event_id,
      value: JSON.stringify(envelope),
    })),
  });
}
