import pandas as pd
import requests

url = "https://dsebd.org/index.php"
try:
    dfs = pd.read_html(url)
    
    for i, df in enumerate(dfs):
        s_df = df.astype(str)
        if s_df.apply(lambda x: x.str.contains('DSEX', case=False).any()).any():
            print(f"!!! MATCH in Table {i} !!!")
            print(df)
            print("-" * 30)
except Exception as e:
    print(f"Error: {e}")
