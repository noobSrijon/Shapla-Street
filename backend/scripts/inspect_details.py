import pandas as pd
import sys

url = "https://dsebd.org/displayCompany.php?name=ACI"
try:
    dfs = pd.read_html(url)
    
    for i, df in enumerate(dfs):
        s = df.astype(str)
        if s.apply(lambda x: x.str.contains('Open', case=False).any()).any():
            print(df)
        if s.apply(lambda x: x.str.contains('Days Range', case=False).any()).any():
            print(df)
except Exception as e:
    print(f"Error: {e}")
