---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Takeaways - 'Big Data Is Dead'"
subtitle: ""
summary: ""
authors: []
tags: ["big-data","blog","takeaways"]
categories: []
date: 2023-03-22
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

I recently read a great [blog post](https://motherduck.com/blog/big-data-is-dead/) by Jordan Tigani about Big Data. While Jordan's post focuses on enterprise needs, I believe it contains relevant insights to individual researchers as well.

If you've had any exposure to the technology space in the past decade, you will have heard of big data. Advances in storage capabilities have unleashed a massive data collection effort across the board. Everyone was excited and assumed that soon we would be completely inundated by data. New methods and technology were needed so we won't drown in all that data and lose out on important insights along the way.

While the amount of data stored has grown significantly, it has not grown as massively as many had feared. Jordan mentions that most enterprises require approximately 100 GB of storage for their data warehousing needs. More interesting to me though is the mentioned difference between compute and storage needs. In his experience, the vast majority of compute queries used 100 MB or less of data - even for companies with terrabytes of data in storage.

Intuitively this should make sense. As data accumulate, a large portion of it will be historic and won't need continuing re-analyis. There are also many techniques that have been developed to update models as data come in, so that you don't need to re-run the entire modeling process each time you get new data, further reducing compute needs. A good example are large language models like ChatGPT. Training the model requires massive amounts of data and compute capabilities, but once the model is trained, storing and working with the computed weights is nearly trivial by comparison. 

So far for the blog post. Let's turn to the academic space. The rising popularity of big data and big data concepts has started spilling over into academic research outside of cs/math/stats as well. I encounter incrising numbers of academics in other fields referring to their data as "big" or aspiring to have "big data." The numbers in Jordan's post are a good reminder of what we are actually talking about when discussing big data and related concepts. Jordan quotes the definition that I tend to give researchers that aren't familiar with the big data field: big data is "whatever doesn't fit on a single machine."

Using that definition, average researchers hoping for "big data" run into the issue of massive improvements in storage and RAM on consumer grade laptops. Hundreds of gigabytes of SSD storage are the norm and laptop reviews these days frequently complain if a laptop is equipped with less than 8 GB of RAM. Outgrowing those needs will be challening for individual researchers or small teams of researchers in most fields, considering an Excel file with 360,000 observations and 90 variables is still only about 90 MB.[^1] If you're able to use Excel, you are very, very far removed from having big data - even if your data set is significantly larger than what is typical in your field.

But that's frankly not a bad thing. Most research doesn't require big data. Acquiring _quality_ big data is also very difficult. As is dealing with big data tools and infrastructure if you're not used to it. And that's not even touching on the analytical methodology relevant to big data. So most researchers who aren't already in the big data field probably shouldn't worry about it.

## Reference 
Tigani, J. (2023), "Big Data is Dead", MotherDuck, Available at [motherduck.com/blog/big-data-is-dead](http://web.archive.org/web/20230318062005/https://motherduck.com/blog/big-data-is-dead/).

[^1]: See [this quora answer](https://www.quora.com/Roughly-how-big-is-an-Excel-file-containing-1-million-rows-and-20-columns). For illustration purposes only. Don't use Excel for that many rows/columns. Just avoid Excel in general.
