from typing import List, Dict;
from dataclasses import dataclass;
from enum import Enum;
from datetime import date, timedelta

import csv

@dataclass
class Flow(Enum):
  spotting = 0
  light = 1
  medium = 2
  heavy = 3
  null = light

def parseSymptomsIntoDict(fileName) -> Dict:
  with open(fileName) as csv_data:
    csvReader = csv.reader(csv_data);
    next(csvReader); # skip header row
    data = {};
    for row in csvReader:
      data[row[0]] = Flow[row[2]].value;
  return data;

def parseCyclesIntoStartEnd(fileName) -> List[Dict]:
  with open(fileName) as csv_data:
    csvReader = csv.reader(csv_data);
    next(csvReader); # skip header row
    data = [];
    for row in csvReader:
      data.append({'start': row[6], 'end': row[7]});
  return data;

def formatCyclesAndSymptoms(periodStartEnd, symptomsDict):
  info = [];

  for period in periodStartEnd:
    startDate = date.fromisoformat(period['start']);
    endDate = date.fromisoformat(period['end']);
    delta = endDate - startDate;

    for i in range(delta.days + 1):
      periodDate = startDate + timedelta(days=i);
      
      if periodDate <= date.today():
        periodDateStr = periodDate.isoformat();
        
        bleedingValue = Flow.null.value;
        if (periodDateStr in symptomsDict):
          bleedingValue = symptomsDict[periodDateStr];

        row = {
          'date': periodDateStr,
          'bleeding.value': bleedingValue,
          'bleeding.exclude': 'false',
        };

        info.append(row);
  
  return info;

def parseDictIntoCsv(fileName, headers, data) -> List[int]:
  with open(fileName, 'w', newline='') as file: 
    writer = csv.DictWriter(file, fieldnames = headers);
    writer.writeheader();
    writer.writerows(data);
  return;

def main():
  periodStartEnd = parseCyclesIntoStartEnd('./test/menstrual_health_cycles.csv');
  symptomsDict = parseSymptomsIntoDict('./test/menstrual_health_symptoms.csv');
  data = formatCyclesAndSymptoms(periodStartEnd, symptomsDict);
  headers = ['date', 'bleeding.value', 'bleeding.exclude'];

  parseDictIntoCsv('./test/fitbit_to_drip.csv', headers, data);

main();