import type { ProviderAdapter, ProviderCompletionOptions } from "./ProviderAdapter";

export class MockProviderAdapter implements ProviderAdapter {
  name = "Mock Provider — no API call";

  async complete(prompt: string, options?: ProviderCompletionOptions): Promise<string> {
    const sectionTitle = String(options?.metadata?.sectionTitle ?? "Service Quality");
    const topic = String(options?.metadata?.chapterTopic ?? "Service Quality");
    const promptChecksum = checksum(prompt);

    return [
      `${this.name}`,
      `Mock draft generated for ${topic}: ${sectionTitle}.`,
      "คุณภาพการบริการ (Service Quality) ควรถูกอธิบายอย่างเป็นระบบ โดยเริ่มจากความคาดหวังของลูกค้า การส่งมอบบริการ และการฟื้นฟูเมื่อเกิดปัญหา (Parasuraman, 1988).",
      "ในฉบับจำลองนี้ Writer Agent ใช้แหล่งข้อมูล mock เท่านั้น และยังคงแสดงคำเตือนเมื่อพบข้อมูลอ้างอิงที่ต้องตรวจสอบก่อนใช้งานจริง.",
      `Prompt checksum: ${promptChecksum}`
    ].join("\n\n");
  }

  async embed(text: string): Promise<number[]> {
    const seed = checksum(text);
    return Array.from({ length: 8 }, (_, index) => {
      const value = (seed + index * 17) % 100;
      return Number((value / 100).toFixed(2));
    });
  }
}

function checksum(value: string): number {
  return value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 997;
}
