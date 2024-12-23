export const calculateIqamahDifference = (timings, iqamahTimings, activePrayer) => {
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };
  
    if (!timings[activePrayer] || !iqamahTimings[activePrayer]) {
      throw new Error(`Invalid prayer name: ${activePrayer}`);
    }
  
    const timingMinutes = timeToMinutes(timings[activePrayer]);
    const iqamahMinutes = timeToMinutes(iqamahTimings[activePrayer]);
  
    const differenceInMinutes = iqamahMinutes - timingMinutes;
  
    return differenceInMinutes;
  };