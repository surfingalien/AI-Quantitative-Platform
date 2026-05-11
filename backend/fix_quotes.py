import glob

files = glob.glob("*.py")
for f in files:
    with open(f, 'r') as file:
        content = file.read()
        
    new_content = content.replace('\\"\\"\\"', '"""')
    
    with open(f, 'w') as file:
        file.write(new_content)
