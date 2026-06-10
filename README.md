# FitbitToDrip

Utility to convert Fitbit menstrual data to Drip menstrual data. Does not store data, all calculations are done in-browser.

## Backstory

After my last Fitbit broke, I decided not to buy another one. But I still needed a lightweight menstrual cycle tracker to keep me from being surprised by my period.

I decided on Drip for privacy and security reasons, but I didn't want to lose my years of data stored in Fitbit that contributed to my stats and start all over. So I wrote a script. On the off-chance someone else finds themselves in the same position as me, hopefully this tool helps.

#### Drip App (not sponsored)
- Play Store: https://play.google.com/store/apps/details?id=com.drip&pcampaignid=web_share
- Apple Store: https://apps.apple.com/us/app/drip-period-cycle-tracker/id1584564949

## How to use

1. Export your Fitbit menstrual health data as `.csv`
  - Export both your cycles and symptoms (flow data - optional for the tool).

#### Python
2. Replace the `menstrual_health_cycles.csv` and `menstrual_health_symptoms.csv` files in the test folder.
3. Run the python script.

#### Tool
2. Select the files.
3. Click Upload.

4. Download the new file (fitbit_to_drip.csv) and import it to drip.

## Supported Conversions
- Flow
  * Spotting=0
  * Light=1
  * Medium=2
  * Heavy=3
  * Default/not entered: light=1


## Development/Contributing

#### Python 3.10
Follow this tutorial for installing python, vscode, and git, on Windows:  
https://docs.microsoft.com/en-us/windows/python/beginners

Open main.py and use the play button to run main().
