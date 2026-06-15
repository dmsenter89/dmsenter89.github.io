---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Easy SASPy Setup from Jupyter"
subtitle: ""
summary: ""
authors: []
tags: ["jupyter", "oda", "saspy"]
categories: []
date: 2022-03-11T08:30:29-04:00
lastmod: 2022-03-16T08:30:29-04:00
featured: false
draft: false

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# Focal points: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight.
image:
  caption: ""
  focal_point: ""
  preview_only: false

# Projects (optional).
#   Associate this post with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `projects = ["internal-project"]` references `content/project/deep-learning/index.md`.
#   Otherwise, set `projects = []`.
projects: []
---

I love using SASPy, but the setup can take a minute. I used to do the setup via the CLI until I 
started thinking I might be able to just do it straight from a Jupyter notebook. Having just a 
couple of cells in Jupyter notebook makes for easy copy-and-paste and reduces setup time. The code
below has been tested on both Windows and Linux. As a bonus,
this also works on  [Google Colab](https://colab.research.google.com/).

You can easily install packages via pip from Jupyter either by using a shell cell (`!`) or by
using the pip magic command: `%pip install saspy`. Once done, copy and paste the following into 
a code cell and run to create the sascfg_personal.py file:

```python
import saspy, platform
from pathlib import Path

# get path for configuration file
cfgpath = saspy.__file__.replace('__init__.py','sascfg_personal.py')

# To pick the path for Java, we need to know whether we're on Windows or not
if platform.system()=='Windows':
    print("Windows detected.")
    javapath = !where java
    authfile = Path(Path.home(),"_authinfo")
else:
    javapath = !which java
    authfile = Path(Path.home(),".authinfo")
    
# the `!` command returns a string list, we want only the string
javapath = javapath[0]
print(f"Java is present at {javapath}")

# US home Region configuration string set up via string-replacement.
# For other server addresses, see https://support.sas.com/ondemand/saspy.html
cfgtext = f"""SAS_config_names=['oda']
oda = {{'java' : '{repr(javapath).strip("'")}',
#US Home Region
'iomhost' : ['odaws01-usw2.oda.sas.com','odaws02-usw2.oda.sas.com','odaws03-usw2.oda.sas.com','odaws04-usw2.oda.sas.com'],
'iomport' : 8591,
'authkey' : 'oda',
'encoding' : 'utf-8'
}}"""

# write the configuration file
with open(cfgpath, 'w') as file:
    file.write(cfgtext)
    print(f"Wrote configuration file to {cfgpath}")
    print(f"Content of file: \n```\n{cfgtext}\n```")
```

Optionally, you can set up an authentication file with your username and password. Without this file,
you'll be prompted for your username and password each time you log in. 

```python
# change variables to match your username and password
omr_user_id = r"max.mustermann@sample.com"
omr_user_password = r"K5d7#QBPw"
with open(authfile, "w") as file:
    file.write(f"oda user {omr_user_id} password {omr_user_password}")
```

And that's it! You're now ready to connect to SASPy. In my experience you don't even need to restart
the kernel to begin work with SAS on ODA. You can try the following snippet in a new cell:

```python
# starts a new SAS session with the `oda` configuration we set up
sas_session = saspy.SASsession(cfgname='oda')

# load a SAS data set and make a scatter plot
cars = sas_session.sasdata('cars', 'sashelp')
cars.scatter(x='msrp', y='horsepower')

# directly run SAS code to print a table
sas_session.submitLST("proc print data=sashelp.cars(obs=6); run;")

# quit SAS connection
sas_session.endsas()
```
