export function calculateExactAge(dob: string | Date | undefined): string | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  
  if (birthDate > today) return "Future date not allowed";

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) return "Future date not allowed";

  const parts = [];
  if (years > 0) parts.push(`${years}Y`);
  if (months > 0) parts.push(`${months}M`);
  if (days > 0) parts.push(`${days}D`);
  
  return parts.length > 0 ? parts.join(" ") : "0D";
}
