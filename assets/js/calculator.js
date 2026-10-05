'use strict';
// Monthly equal-payment estimate. No grace period or daily-interest adjustments.
function calculateLoan(principal, annualRate, months) {
  if (!Number.isFinite(principal) || principal <= 0 || principal > 100000000 ||
      !Number.isFinite(annualRate) || annualRate < 0 || annualRate > 20 ||
      !Number.isInteger(months) || months < 1 || months > 120) {
    throw new RangeError('올바른 대출금액·금리·기간을 입력해 주세요.');
  }
  const rate = annualRate / 1200;
  const monthly = rate === 0 ? principal / months : principal * rate / -Math.expm1(-months * Math.log1p(rate));
  const total = monthly * months;
  return { monthly, total, interest: Math.max(0, total - principal), principal };
}
function calculatePlan(principal, annualRate, repaymentMonths, graceMonths = 0, graceAnnualRate = annualRate) {
  if (!Number.isInteger(graceMonths) || graceMonths < 0 || graceMonths > 72 ||
      !Number.isFinite(graceAnnualRate) || graceAnnualRate < 0 || graceAnnualRate > 20 ||
      repaymentMonths + graceMonths > 132) {
    throw new RangeError('올바른 거치기간·금리를 선택해 주세요.');
  }
  const repayment = calculateLoan(principal, annualRate, repaymentMonths);
  const graceMonthly = principal * graceAnnualRate / 1200;
  const graceInterest = graceMonthly * graceMonths;
  const balances = Array(graceMonths + 1).fill(principal);
  let balance = principal;
  for (let month = 1; month <= repaymentMonths; month++) {
    const principalPaid = month === repaymentMonths ? balance : repayment.monthly - balance * annualRate / 1200;
    balance = Math.max(0, balance - principalPaid);
    balances.push(balance);
  }
  return { ...repayment, total: repayment.total + graceInterest,
    interest: repayment.interest + graceInterest, repaymentInterest: repayment.interest,
    graceInterest, graceMonthly, totalMonths: repaymentMonths + graceMonths, balances };
}
if (typeof window !== 'undefined') window.MisoCalculator = { calculateLoan, calculatePlan };
if (typeof module !== 'undefined') module.exports = { calculateLoan, calculatePlan };
