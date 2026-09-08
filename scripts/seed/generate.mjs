import { createHash } from "node:crypto";

const LAND_COUNT = 30;
const PLOTS_PER_LAND = 20;
const CUSTOMER_COUNT = 400;
const CONTRACT_COUNT = 450;

const LOCATIONS = [
  ["Củ Chi", "Thành phố Hồ Chí Minh"],
  ["Hóc Môn", "Thành phố Hồ Chí Minh"],
  ["Bến Lức", "Long An"],
  ["Đức Hòa", "Long An"],
  ["Trảng Bom", "Đồng Nai"],
  ["Long Thành", "Đồng Nai"],
  ["Bến Cát", "Bình Dương"],
  ["Tân Uyên", "Bình Dương"],
  ["Châu Thành", "Tây Ninh"],
  ["Phú Mỹ", "Bà Rịa - Vũng Tàu"],
];

const FAMILY_NAMES = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng",
  "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Đinh", "Mai", "Tạ", "Cao",
];

const GIVEN_NAMES = [
  "Minh Anh", "Quốc Bảo", "Thanh Hà", "Hoàng Nam", "Thu Trang",
  "Đức Huy", "Ngọc Lan", "Gia Hân", "Tuấn Kiệt", "Phương Thảo",
  "Anh Khoa", "Khánh Linh", "Quang Vinh", "Bảo Ngọc", "Hữu Phúc",
  "Kim Oanh", "Nhật Minh", "Thùy Dương", "Trọng Nghĩa", "Yến Nhi",
];

const FREQUENCIES = [
  "monthly", "monthly", "monthly", "monthly", "monthly", "monthly",
  "quarterly", "quarterly", "yearly", "custom",
];

const FREQUENCY_MONTHS = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
  custom: 2,
};

function deterministicUuid(scope, index) {
  const hex = createHash("sha256")
    .update(`astryx-demo-v1:${scope}:${index}`)
    .digest("hex")
    .slice(0, 32)
    .split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function parseAsOf(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError("asOf must use YYYY-MM-DD format");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new TypeError("asOf must be a valid calendar date");
  }
  return date;
}

function dateFromParts(year, month, day) {
  const monthStart = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(
    monthStart.getUTCFullYear(),
    monthStart.getUTCMonth() + 1,
    0,
  )).getUTCDate();
  return new Date(Date.UTC(
    monthStart.getUTCFullYear(),
    monthStart.getUTCMonth(),
    Math.min(day, lastDay),
  ));
}

function addMonths(date, months, day = date.getUTCDate()) {
  return dateFromParts(date.getUTCFullYear(), date.getUTCMonth() + months, day);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 86_400_000);
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function isoTimestamp(date, hour = 2) {
  const timestamp = new Date(date);
  timestamp.setUTCHours(hour, 0, 0, 0);
  return timestamp.toISOString();
}

function roundMoney(value) {
  return Math.round(value / 100_000) * 100_000;
}

function contractStatus(index) {
  if (index < 330) return "active";
  if (index < 420) return "completed";
  return "cancelled";
}

function contractDates(index, status, windowStart) {
  if (status === "active") {
    const start = addMonths(windowStart, index % 12, 1);
    const duration = 24 + (index % 3) * 6;
    return { start, end: addDays(addMonths(start, duration, 1), -1), duration };
  }

  if (status === "completed") {
    const start = addMonths(windowStart, index % 3, 1);
    const duration = 6 + (index % 4);
    return { start, end: addDays(addMonths(start, duration, 1), -1), duration };
  }

  const start = addMonths(windowStart, index % 4, 1);
  const duration = 4 + (index % 4);
  return { start, end: addDays(addMonths(start, duration, 1), -1), duration };
}

function buildLandsAndPlots(nowTimestamp) {
  const lands = [];
  const plots = [];

  for (let landIndex = 0; landIndex < LAND_COUNT; landIndex += 1) {
    const landId = deterministicUuid("land", landIndex);
    const [district, province] = LOCATIONS[landIndex % LOCATIONS.length];
    let landArea = 0;

    for (let plotOffset = 0; plotOffset < PLOTS_PER_LAND; plotOffset += 1) {
      const plotIndex = landIndex * PLOTS_PER_LAND + plotOffset;
      const area = 100 + ((plotIndex * 37 + landIndex * 11) % 23) * 10;
      landArea += area;
      plots.push({
        id: deterministicUuid("plot", plotIndex),
        land_id: landId,
        plot_number: `${String.fromCharCode(65 + (plotOffset % 5))}-${String(plotOffset + 1).padStart(2, "0")}`,
        area_sqm: area,
        description: plotOffset % 4 === 0 ? "Lô góc, đường nội bộ thuận tiện" : "Mặt bằng bằng phẳng, ranh giới rõ ràng",
        status: plotIndex < 330 ? "rented" : plotIndex >= 570 ? "sold" : "available",
        image_url: null,
        created_at: nowTimestamp,
        updated_at: nowTimestamp,
      });
    }

    lands.push({
      id: landId,
      name: `Khu đất ${district} ${String(landIndex + 1).padStart(2, "0")}`,
      location: `${district}, ${province}, Việt Nam`,
      area_sqm: landArea,
      description: "Khu đất cho thuê dài hạn, có đường nội bộ và hạ tầng cơ bản.",
      image_url: null,
      created_at: nowTimestamp,
      updated_at: nowTimestamp,
    });
  }

  return { lands, plots };
}

function buildCustomers(nowTimestamp) {
  return Array.from({ length: CUSTOMER_COUNT }, (_, index) => {
    const [district, province] = LOCATIONS[index % LOCATIONS.length];
    const familyName = FAMILY_NAMES[Math.floor(index / GIVEN_NAMES.length)];
    const givenName = GIVEN_NAMES[index % GIVEN_NAMES.length];
    return {
      id: deterministicUuid("customer", index),
      name: `${familyName} ${givenName}`,
      phone: `0900${String(index + 1).padStart(6, "0")}`,
      email: `khach-hang-${String(index + 1).padStart(3, "0")}@example.test`,
      address: `${12 + (index % 187)} Đường Mẫu ${index % 12 + 1}, ${district}, ${province}, Việt Nam`,
      notes: "Dữ liệu minh họa; thông tin liên hệ hoàn toàn hư cấu.",
      created_at: nowTimestamp,
      updated_at: nowTimestamp,
    };
  });
}

function schedulePayments(contract, contractIndex, asOfDate, windowStart, windowEnd, nowTimestamp) {
  const payments = [];
  const start = parseAsOf(contract.start_date);
  const end = parseAsOf(contract.end_date);
  const scheduleStart = start > windowStart ? start : windowStart;
  const scheduleEnd = end < windowEnd ? end : windowEnd;
  const step = FREQUENCY_MONTHS[contract.payment_frequency];
  let ordinal = 0;

  for (let monthOffset = 0; ; monthOffset += step) {
    const due = addMonths(start, monthOffset, contract.due_day);
    if (due > scheduleEnd) break;
    if (due < scheduleStart || due < start) continue;

    let status = "pending";
    let paidAt = null;
    if (due < asOfDate) {
      const shouldBeOverdue = contract.status !== "completed" && (contractIndex + ordinal) % 11 === 0;
      status = shouldBeOverdue ? "overdue" : "paid";
      if (status === "paid") {
        const paidDate = addDays(due, (contractIndex + ordinal) % 5);
        paidAt = isoTimestamp(paidDate > asOfDate ? asOfDate : paidDate, 0);
      }
    }

    payments.push({
      id: deterministicUuid(`contract-payment-${contractIndex}`, ordinal),
      contract_id: contract.id,
      due_date: isoDate(due),
      amount: contract.rent_amount,
      paid_at: paidAt,
      status,
      created_at: contract.created_at,
      updated_at: paidAt ?? (due < asOfDate ? nowTimestamp : contract.created_at),
    });
    ordinal += 1;
  }

  return payments;
}

export function generateSeedData({ asOf = new Date().toISOString().slice(0, 10) } = {}) {
  const asOfDate = parseAsOf(asOf);
  const windowStart = dateFromParts(asOfDate.getUTCFullYear(), asOfDate.getUTCMonth() - 11, 1);
  const windowEnd = addDays(dateFromParts(asOfDate.getUTCFullYear(), asOfDate.getUTCMonth() + 13, 1), -1);
  const nowTimestamp = isoTimestamp(asOfDate, 1);
  const { lands, plots } = buildLandsAndPlots(isoTimestamp(addDays(windowStart, -60)));
  const customers = buildCustomers(isoTimestamp(addDays(windowStart, -30)));
  const contracts = [];
  const contractPayments = [];

  for (let index = 0; index < CONTRACT_COUNT; index += 1) {
    const status = contractStatus(index);
    const frequency = FREQUENCIES[index % FREQUENCIES.length];
    const { start, end, duration } = contractDates(index, status, windowStart);
    const dueDay = 1 + (index * 7) % 28;
    const monthlyRate = roundMoney(1_500_000 + plots[index].area_sqm * 9_000 + (index % 8) * 250_000);
    const frequencyMultiplier = { monthly: 1, quarterly: 2.9, yearly: 10.8, custom: 1.95 }[frequency];
    const contract = {
      id: deterministicUuid("contract", index),
      customer_id: customers[index % customers.length].id,
      land_id: null,
      plot_id: plots[index].id,
      deposit_amount: roundMoney(monthlyRate * (1 + index % 3)),
      rent_amount: roundMoney(monthlyRate * frequencyMultiplier),
      due_day: dueDay,
      lease_duration_months: duration,
      payment_frequency: frequency,
      payment_due_day: dueDay,
      next_payment_due_date: null,
      start_date: isoDate(start),
      end_date: isoDate(end),
      status,
      notes: status === "cancelled" ? "Hợp đồng mẫu đã kết thúc trước hạn." : "Hợp đồng thuê mẫu phục vụ dữ liệu minh họa.",
      created_at: isoTimestamp(addDays(start, -7)),
      updated_at: status === "active" ? nowTimestamp : isoTimestamp(end),
    };
    const payments = schedulePayments(contract, index, asOfDate, windowStart, windowEnd, nowTimestamp);
    const nextPayment = payments.find((payment) => payment.due_date >= asOf);
    if (status === "active") contract.next_payment_due_date = nextPayment?.due_date ?? null;
    contracts.push(contract);
    contractPayments.push(...payments);
  }

  for (const customer of customers) {
    const firstContract = contracts.filter(contract => contract.customer_id === customer.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
    if (firstContract) {
      customer.created_at = isoTimestamp(addDays(new Date(firstContract.created_at), -3));
      customer.updated_at = firstContract.created_at;
    }
  }
  return {
    metadata: {
      version: 1,
      asOf,
      historyStart: isoDate(windowStart),
      scheduleEnd: isoDate(windowEnd),
    },
    lands,
    plots,
    customers,
    contracts,
    contractPayments,
  };
}
