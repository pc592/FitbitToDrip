import { DateTime } from 'luxon';
import { parse, unparse } from 'papaparse';

type FlowType = {
  [key: string]: string;
};

export const Flow: FlowType = {
  spotting: "0",
  light: "1",
  medium: "2",
  heavy: "3",
  get null() { return this.light},
} as const;

type CyclesType = {
  start: string,
  end: string,
}
type SymptomsType = { [timestamp: string]: string};

type RowType = { [key: string]: string};

const parseFile = (rawFile: File): Promise<RowType[]> => {
  return new Promise(resolve => {
    parse(rawFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as RowType[]);
      }
    });
  });
};

const validateFile = (parsedData: RowType[], validateHeaders: string[] = []): boolean => {
  const isValid = parsedData.some((row) => {
    for (const header of validateHeaders) {
      if (header in row) {
        return true;
      }
    }
    return false;
  });
  return isValid;
}

const parseCyclesIntoStartEnd = async (cyclesFile?: File): Promise<CyclesType[]> => {
  if (!cyclesFile) {
    return [];
  }
  const parsedData = await parseFile(cyclesFile);
  const isValid = validateFile(parsedData, ['period_start_date', 'period_end_date']);
  if (!isValid) {
    throw new Error('Invalid cycles.csv. Check the correct file was uploaded.');
  }
  const cyclesData = parsedData.map((row) => {
    const { period_start_date, period_end_date } = row as RowType;
    return {
      start: period_start_date,
      end: period_end_date,
    };
  });
  return cyclesData;
}

const parseSymptomsIntoDict = async (symptomsFile?: File): Promise<SymptomsType> => {
  if (!symptomsFile) {
    return {};
  }
  const parsedData = await parseFile(symptomsFile);
  const isValid = validateFile(parsedData, ['timestamp', 'flow']);
  if (!isValid) {
    throw new Error('Invalid symptoms.csv. Check the correct file was uploaded.');
  }
  let symptomsData: SymptomsType = {};
  symptomsData = parsedData.reduce((dict, row) => {
    const { timestamp, flow } = row as RowType;
    dict[timestamp] = Flow[flow];
    return dict;
  }, symptomsData);
  return symptomsData;
}

const formatCyclesAndSymptoms = (periodStartEnd: CyclesType[], symptomsDict: SymptomsType) => {
  const info = [];
  for (const period of periodStartEnd) {
    const startDate = DateTime.fromISO(period['start']);
    const endDate = DateTime.fromISO(period['end']);
    const delta = endDate.diff(startDate, 'days');
    
    for (let i=0; i <= delta.days; i++) {
      const periodDate = startDate.plus({ days: i});

      if (periodDate <= DateTime.now()) {
        const periodDateStr = periodDate.toISODate();
        
        let bleedingValue = Flow.null;
        const bleedingExclude = 'false';
        if (periodDateStr && periodDateStr in symptomsDict) {
          bleedingValue = symptomsDict[periodDateStr];
        }

        const row = {
          'date': periodDateStr,
          'bleeding.value': bleedingValue,
          'bleeding.exclude': bleedingExclude,
        };

        info.push(row);
      }
    }
  }
  return info;
}

const disableDownloadBtn = (downloadBtnId: string): void => {
  const downloadBtn = document.getElementById(downloadBtnId) as HTMLAnchorElement;
  downloadBtn.href = '#';
  downloadBtn.removeAttribute('download');
  downloadBtn.classList.add('disabled');
  downloadBtn.setAttribute('tabIndex', '-1');
  downloadBtn.setAttribute('aria-disabled', 'true');
}

const enableDownloadBtn = (downloadBtnId: string, csvURL: string): void => {
  const downloadBtn = document.getElementById(downloadBtnId) as HTMLAnchorElement;
  downloadBtn.href = csvURL;
  downloadBtn.setAttribute('download', 'fitbit_to_drip.csv');
  downloadBtn.classList.remove('disabled');
  downloadBtn.setAttribute('tabIndex', '0');
  downloadBtn.setAttribute('aria-disabled', 'false');
}

const appendMsg = (container: HTMLDivElement, msg: string): void => {
  const text = document.createTextNode(`${DateTime.now().toFormat('hh:mm')} > ${msg}`);
  container.prepend(document.createElement('br'));
  container.prepend(text);
}

document.addEventListener("DOMContentLoaded", function(_event) {
  const cyclesInput = document.getElementById('cyclesFile') as HTMLInputElement;
  cyclesInput.onchange = (_e: Event) => {
    disableDownloadBtn('download-btn');
  };
  
  const symptomsInput = document.getElementById('symptomsFile') as HTMLInputElement;
  symptomsInput.onchange = (_e: Event) => {
    disableDownloadBtn('download-btn');
  };

  const messagesContainer = document.getElementById('msgs-container') as HTMLDivElement;
  const filesForm = document.getElementById('files-form') as HTMLFormElement;
  filesForm.onsubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLFormElement;
    const cyclesFile = (target.cyclesFile as HTMLInputElement).files?.[0];
    const symptomsFile = (target.symptomsFile as HTMLInputElement).files?.[0];

    let periodStartEnd: CyclesType[] = [];
    let cyclesErr;
    try {
      periodStartEnd = await parseCyclesIntoStartEnd(cyclesFile);
      cyclesErr = false;
    } catch (e) {
      appendMsg(messagesContainer, e as string);
      cyclesErr = true;
    }
    let symptomsDict: SymptomsType = {};
    let symptomsErr;
    try {
      symptomsDict = await parseSymptomsIntoDict(symptomsFile);
      symptomsErr = false;
    } catch (e) {
      appendMsg(messagesContainer, e as string);
      symptomsErr = true;
    }
    const data = formatCyclesAndSymptoms(periodStartEnd, symptomsDict);

    if (cyclesErr || symptomsErr) {
      return;
    }
    if (!data.length) {
      appendMsg(messagesContainer, 'No data converted, no file to download.');
    } else {
      appendMsg(messagesContainer, 'Data converted, ready to download.');
      const headers = ['date', 'bleeding.value', 'bleeding.exclude'];
      const csvString = unparse(data, { header: true, columns: headers });

      const csvBlob = new Blob([csvString], {type: 'text/csv;charset=utf-8;'});
      const csvURL = window.URL.createObjectURL(csvBlob);
      enableDownloadBtn('download-btn', csvURL);
    }
  };
});