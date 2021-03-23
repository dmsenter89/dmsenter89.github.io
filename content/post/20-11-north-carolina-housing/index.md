---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "North Carolina Housing Data"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2020-11-06T10:10:01-05:00
lastmod: 2020-11-30T10:10:01-05:00
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
A popular beginners machine learning problem is the prediction of housing prices. A frequently used data set for this purpose uses housing prices in California along some additional  gathered through the 1990 Census. One such data set is available [here](https://www.kaggle.com/camnugent/california-housing-prices) at Kaggle. Unfortunately, that data set is rather old. And I live in North Carolina, not California! So I figured I might as well create a new housing data set, but this time with more up-to-date information and using North Carolina as the state to be analyzed. One thing that may be interesting about North Carlina as compared to California is the position of major populations centers. In California, major population centers are near the beach, while major population centers in North Carolina are in the interior of the state. Both large citites and proximity to the beach tend to correlate with higher housing prices. In California, unlike in North Carolina, both of these go together.

This post will describe the Kaggle data set with California housing prices and then walk you through how the relevant data can be acquired from the Census Bureau. I'll also show how to clean the data. For those who just want to explore the complete data set, I have made it available for download {{% staticref "files/NC_Housing_Prices_2018.csv" "newtab" %}}here{{% /staticref %}}.

{{% toc %}}

## The Source Data Set

The geographic unit of the Kaggle data set is the Census block group, which means we will have several thousand data points for our analysis. For a good big-picture overview of Census geography divisions, see this [post](https://pitt.libguides.com/uscensus/understandinggeography) from the University of Pittsburgh library. The data set's ten columns contain geographic, housing, and Census information that can be broken down as follows:

- geographic information
    - longitude
    - latitude
    - ocean proximity
- housing information
    - median age of homes
    - median value of homes
    - total number of rooms in area
    - total number of bedrooms in the area
- Census information
    - population
    - number of households
    - median income
    
Most of these exist directly in the Census API data that we have [covered previously]({{< ref "/post/20-08-census-api/index.md" >}}). The ocean proximity variable is a categorical giving approximate distance from the beach. My data set will not include this last categorical variable.

## Acquiring the Census Data Set 

### Census Variables
The first, and most time consuming aspect, is to figure out where the data we want is located. We know that the US has a decennial census, so accurate information is available every ten years at every level of geography that the Census Bureau tracks. Since it is currently a census year 2020 and the newest information hasn't been tabulated yet, that means the last census count that is available is from 2010. While this is 20 years more current than the California set from 1990, it still seems a bit outdated. Luckily, since the introduction of the American Community Survey (ACS) we have annually updated information available - but not for every level of geography. Only the 5-year ACS average gives us census block-level information for the whole state, making it comparable to the Kaggle data set. The most recent of these is the 2018. 

I start by creating a data dictionary from the [groups](https://api.census.gov/data/2018/acs/acs5/groups.html) and [variables](
https://api.census.gov/data/2018/acs/acs5/variables.html) pages of the "American Community Survey: 1-Year Estimates: Detailed Tables 5-Year" data set. Note that median home age is not directly available. Instead, we will use the median year structures were built to calculate the median home age. Our data dictionary also does not include any data for the longitude and latitude of each row. We will get that data separately.


```python
data_dictionary = {
    'B01001_001E' : "population",
    'B11001_001E' : "households",
    'B19013_001E' : "median_income", 
    'B25077_001E' : "median_house_value",
    'B25035_001E' : "median_year_structure_built",
    'B25041_001E' : "total_bedrooms",
    'B25017_001E' : "total_rooms",
}
```

### Geography Considerations

The next step is figuring out exactly what level of geography we want. Our data set goes down to the Census block level at its most granular. Unfortunately, the Census API won't let us pull the data for all the Census blocks in a state at once. Census tracts on the other hand can be acquired in one go. If we were to shortcut and use only tract data, this would be a pretty quick API call build:

```python
primary_geo = "tract:*"
secondary_geo = "state:37"
query = base_URL + "?get=" + ",".join(data_dictionary.keys()) + f"&for={primary_geo}&in={secondary_geo}"
```

But let's try and do it for the Census blocks instead. This will require us to build a sequence of API calls that loops over a larger geographic area, say the different counties in the state, and pull in the respective census block data for that geographic unit. While the FIPS codes for the state counties are sorted alphabetically, they are not contiguous. A full listing of North Carolina county FIPS codes is availalbe [from NCSU here](https://www.lib.ncsu.edu/gis/countyfips). It appears to be that the county FIPS codes are three digits long, starting at `001` and go up to `199` in increments of 2, meaning only odd numbers are in the county set. So it looks like we will be using `range(1,200,2)` with zero-padding to create the list of county FIPS codes. So we could use a loop similar to this:

```python
vars_requested = ",".join(data_dictionary.keys())

for i in range(1,200,2):
    geo_request = f"for=block%20group:*&in=state:37%20county:{i:03}"
    query = base_URL + f"?get={vars_requested}&{geo_request}"
```

While practicing to write the appropriate API call, you may find it useful to give it frequent, quick tests using curl. If you are using Jupyter or IPython, you can use `!curl "{query}"` to test your API query. Don't forget the quotation marks, since the ampersand has special meaning in the shell. It may be helpful to test the output of your call at the county or city level with that reported on the [Census Quickfacts page](https://www.census.gov/quickfacts/fact/table/US/PST045219), if your variable is listed there. This can help make sure you are pulling the data you actually want.

Now that we have figured out the loop necessary for creation of the API calls, we can put everything together and create a list of Pandas DataFrames which we then concatenate to create our master list.


```python
import pandas as pd
import requests

# create the base-URL
host_name = "https://api.census.gov/data"
year = "2018"
dataset_name = "acs/acs5"
base_URL = f"{host_name}/{year}/{dataset_name}"

# build the api calls as a list
query_vars = base_URL + "?get=" + ",".join(list(data_dictionary.keys()) + ["NAME","GEO_ID"])
api_calls = [query_vars + f"&for=block%20group:*&in=state:37%20county:{i:03}" for i in range(1,200,2) ]

# running the API calls will take a moment
rjson_list = [requests.get(call).json() for call in api_calls]

# create the data frame by concatenation
df_list = [pd.DataFrame(data[1:], columns=data[0]) for data in rjson_list]
df = pd.concat(df_list, ignore_index=True)

# save the raw output to disk
df.to_csv("raw_census.csv", index=False)
```

And now we have the data set! We do still have to address the issue of our values all being imported as strings as mentioned in my [Census API post]({{< ref "/post/20-08-census-api/index.md" >}}).

## Acquiring Location Data

As mentioned above, we are still missing information regarding the latitude and longitude of the different block groups. The Census Bureau makes a lot of geographically coded data available on its [TIGERweb](https://tigerweb.geo.census.gov/tigerwebmain/TIGERweb_main.html) page. You can interact with it both using a REST API and its web-interface. A page with map information exists [here](https://tigerweb.geo.census.gov/arcgis/rest/services/Generalized_ACS2018/Tracts_Blocks/MapServer/4). 

Dealing with shapefiles and the TIGERweb API can get a little complicated. Luckily, I know someone with expertise in GIS and shapefiles so we will be using a CSV file of the geographic data we need courtesy of [Summer Faircloth](https://www.linkedin.com/in/summer-faircloth-652797137), a GIS intern at the North Carolina Department of Transportation. She downloaded the TIGER/Line Shapefiles for the 20189 ACS [Block Groups](https://catalog.data.gov/dataset/tiger-line-shapefile-2018-state-north-carolina-current-block-group-state-based) and [Census Tracts](https://catalog.data.gov/dataset/tiger-line-shapefile-2018-state-north-carolina-current-census-tract-state-based) and joined the data sets in ArcMap, from where she exported our CSV file, which is now {{% staticref "files/BlockGroup_Tract2018.csv" "newtab" %}}available here{{% /staticref %}}.

We don't need all of the columns in the CSV file, so we will limit the import to the parts we need with the `usecols` keyword.


```python
df = pd.read_csv("raw_census.csv", dtype={})
```


```python
shapedata = pd.read_csv("BlockGroup_Tract2018.csv", 
                        dtype={"GEOID": str},
                        usecols=['GEOID','NAMELSAD','INTPTLAT','INTPTLON','NAMELSAD_1'] )

shapedata = shapedata.rename(columns={'INTPTLAT' : 'latitude', 'INTPTLON' : 'longitude' })
```

## Data Merge with GEOID Matching

At this stage we have two data frames - the first consists of all the Census information sans the geographic coordinates of the block groups, and a second data set containing the block groups' location. Both data sets contain a GEOID column that can be used for merging. The GEOID returned by the Census API includes additional information to the regular FIPS code based GEOID used in the TIGERweb system. For example, "1500000US370010204005" in the census data set is actually GEOID "370010204005" for purposes of the TIGERweb data set. We'll use a string split to make our GEO_ID variable from the Census API compatible with the FIPS code based GEOID from the TIGERweb service.


```python
df["GEO_ID"] = df["GEO_ID"].str.split('US').str[1]

df = df.merge(shapedata, left_on='GEO_ID', right_on="GEOID")
```

## Data Cleaning

Now that our data set has been assembled, we can work on cleaning up the merged data set. We have the following tasks left:

- convert column data types to numeric
- drop unnecessary columns
- rename columns
- handle missing values
- calculate median age of homes


```python
for col in data_dictionary.keys():
    if col not in ["NAME", "GEO_ID"]:
        df[col] = pd.to_numeric(df[col])
```

To indicate missing values, the Census API returns a value of "-666666666" in numeric columns. As all of our variables - except for longitude - ought to be positive, we can use the `mask` function to convert all negative values to missing. We'll start by filtering out the string columns that are no longer necessary.


```python
# filter down to our numerical columns
keeps = list(data_dictionary.keys()) +["latitude", "longitude"]
df = df.filter(items=keeps)

# replace vals < 0 with missing
k = df.loc[:, df.columns != 'longitude']
k = k.mask(k < 0)
df.loc[:, df.columns != 'longitude'] = k
```

Now that the missing values have been handled, we can go ahead and calculate our median home age.


```python
df.rename(columns=data_dictionary, inplace=True)
df["housing_median_age"] = 2018 - df["median_year_structure_built"]
df.drop(columns="median_year_structure_built", inplace=True)
```

And now we're done! We will save our output data set to disk for future analysis in a different post.


```python
df.to_csv("NC_Housing_Prices_2018.csv", index=False)
```
