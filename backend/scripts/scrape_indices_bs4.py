import requests
from bs4 import BeautifulSoup

url = "https://dsebd.org/index.php"
try:
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    results = soup.find_all(string=lambda text: "DSEX" in text if text else False)
    
    for i, res in enumerate(results):
        
        parent = res.parent
        container = parent.parent
        if container:
            print(container.prettify()[:500])
        print("-" * 30)

except Exception as e:
    print(f"Error: {e}")
