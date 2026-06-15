---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Why I'm Not Worried About ChatGPT"
subtitle: ""
summary: ""
authors: []
tags: ["ai", "chatgpt", "machine-learning", "opinion"]
categories: []
date: 2023-01-27
lastmod: 2023-04-04
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

ChatGPT has been all over my newsfeed lately, with a considerable amount of hype. In particular, many are wondering or  even worrying whether the emergence of this technology will threaten jobs with moderate to high education requirments. See for example ["How ChatGPT Will Destabilize White-Collar Work" (The Atlantic)](https://www.theatlantic.com/ideas/archive/2023/01/chatgpt-ai-economy-automation-jobs/672767/), where Annie Lowrey leads with "In the next five years, it is likely that AI will begin to reduce employment for college-educated workers." I do not share these views. In fact, I am somewhat underwhelmed by the threat of ChatGPT for a number of reasons. Since this topic has come up a few times for me lately, I will write down my thoughts here so I can reference them more easily. 

## ChatGPT Cannot Think
The first issue I take with many of the AI hype articles is that despite what the news coverage may imply, ChatGPT cannot think. To be honest, when I see articles talking about ChatGPT as "intelligent" or "thinking," the first thing that comes to mind is [this SMBC](http://smbc-comics.com/comic/2011-08-17) from 2011-08-17:

![](https://www.smbc-comics.com/comics/20110817.gif)

In my view, ChatGPT is a lot like this parrot - except that I do think it is fundamentally different, and ChatGPT is not "conscious" and does not "think" in a meaningful way. Despite the many advances made, artificial intelligence (AI) functions differently than a natural intelligence (NI), and in any ChatGPT is not designed to "think."

Before giving a big picture view of how a large language model like ChatGPT works, I want to illustrate the limited flexibility of AI with an example from image recognition. An NI can readily distinguish between what is in the foreground and background of an image. Think of an image like this: 

![](https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Insect_on_blue_flower.jpg/500px-Insect_on_blue_flower.jpg)

A human will have no problem distinguishing between the insect in the image, the flower it is on, and the foliage in the background as distinct objects in different planes. This holds true even if the individual is not familiar with the particular plant or insect in the image. If given additional images of either the insect on a different background or the same background without the insect, we would not mistake the the plant for the insect or the other way around.

Now consider an AI model trained to recognize insects. The algorithm doesn't have a concept of "insect" or "plant," per se. Rather, it notices patterns in images that are labeled "insect" or labeled with a particular insect. The pattern it learns does not depend on it having a concept of "insect." What that means in practice, is that our model might learn that the background is equally or even more important than the foreground. If we train our data set with bees on flowers, but not flowers without bees, we may end up with a model that declares flower photos "bees." This phenomeon is known in image recognition, and people are actively working on methods around this problem. But it nicely illustrates how AI is not "smart," and humans need to do a lot of heavy lifting to get the AI algorithm to perform as intended, even if the application domain is relatively limited. For more information on this application, see [this article](https://gradientscience.org/background/) from GradientScience.

## How does it Work?
With this background, let's get an overview of how models like ChatGPT work. A good summary of the techniques involved is detailed in [this post](https://www.assemblyai.com/blog/how-chatgpt-actually-works/) by AssemblyAI. In simple terms, a model is exposed to large amounts of data in order to learn about the structure of words and how the are aligned in sentences. In principle, this is not too different from the text prediction feature you have on your phone while texting. But this methodology only works to help produce coherent or seemingly coherent sentences by completion. Marked language modeling is a method use to help the model learn about syntax as well to improve the output.

What is new with ChatGPT is that in addition labeled training material, it utilizes human feedback to improve its output. Deep down, AI models can be thought of as optimizing some (very complicated) function. This goal function need not necessarily be written down explicitly. OpenAI uses a method where a model gives two possible outputs for a prompt, and then a human judges which is "better," somewhat similar to when an optometrist asks you if "1" or "2" is better. It then uses this feedback to improve its output iteratively. See [this blog post](https://openai.com/blog/deep-reinforcement-learning-from-human-preferences/) from OpenAI where they use this methodology to animate a backflip.

ChatGPT uses [three steps](https://www.assemblyai.com/blog/how-chatgpt-actually-works/#reinforcement-learning-from-human-feedback) for human feedback based reinforcement learning. You can already imagine some of the issues that can arise from using this method. For one, if human feedback is used to train the model, then we can expect the model to reflect the thoughts and opinions of the labelers to some degree. Labelers may be mistaken and might not be experts in whatever topic they are reviewing. They may be fundamentally mistaken or biased about what we would consider high school-level knowledge.[^1] This is on top of the issues of the large amount of source text used in the initial training phase. These source texts may vary wildly in style and accuracy. Even humans reviewing an article may not be able to distinguish facts from opinion, let alone a language model using many source texts as input. Which leads us to what I see as a main problem for ChatGPT.

## Factual Inaccuracies
Despite the confidence exuded by ChatGPTs output, it will readily produce a number of factual inaccuracies or give bad advice when explaining how to do tasks. See for example Avram Piltch's ["I Asked ChatGPT How to Build a PC. It Told Me to Break My CPU" (Tom's Hardware)](https://www.tomshardware.com/news/chatgpt-told-me-break-my-cpu), where ChatGPT gives instructions for a computer assembly that is potentially damaging to the hardware. 

Or [this article (ToolGuyd)](https://toolguyd.com/ai-chatgpt-cordless-drill-recommendation-2023/) where Stuart asked ChatGPT to recommend a cordless powerdrill. ChatGPT made three recommendations. In explaining its recommendations, it gave several tech specs about the recommended products. The only problem is that it got several of these items wrong. It made mistakes about what type of drill a particular model was, whether the battery is included in the particular SKU it listed or not, and how many BPM the model delivers. It also recommended a discontinued model. 

As a third example, consider [this post](https://betonit.substack.com/p/chatgpt-takes-my-midterm-and-gets) where economics professor Bryan Caplan attempts to let ChatGPT take one his more recent midterms. It's quite detailed and includes the questions, answers, and grading rubric Bryan used. He gave ChatGPT a D on this exam, substantially below the average grade human students in the class received.

I would like to highlight that my argument isn't that ChatGPT gets everything wrong - it doesn't. It can even perform exceptionally well at certain tasks. See [this white paper](https://mackinstitute.wharton.upenn.edu/wp-content/uploads/2023/01/Christian-Terwiesch-Chat-GTP.pdf) by Christian Terwiesch grading ChatGPT's attempt at the final exam Wharton Business School MBA core course for just one example. A little googling will quickly lead to other examples, such as it passing law school exams or giving decent answers to tech sector interview questions.

My concern is that it sounds very confident in its answers, but it is not always trivial for the average person to verify whether or not ChatGPT's output is trustworthy. As Rupert Goodwin [put it](https://www.theregister.com/2022/12/12/chatgpt_has_mastered_the_confidence/), ChatGPT is "a Dunning-Kruger effect knowledge simulator par excellence." And that's a problem if people decide to just trust it to produce truth, when ChatGPT has no idea what "truth" is. It's important to know that OpenAI is aware of this and it even says so on it's [FAQ page](https://help.openai.com/en/articles/6783457-chatgpt-faq):

>4. Can I trust that the AI is telling me the truth?
>
> a. ChatGPT is not connected to the internet, and it can occasionally produce incorrect answers. It has limited knowledge of world and events after 2021 and may also occasionally produce harmful instructions or biased content.
> 
>    We'd recommend checking whether responses from the model are accurate or not. If you find an answer is incorrect, please provide that feedback by using the "Thumbs Down" button.

In my opinion this is reasonable and to be expected. I think some people may get too excited and feel too confident in this technology when it just isn't as reliable as many would wish at this stage. And for those reasons, I don't think it's coming for our jobs any time soon. 

_Note:_ If you use ChatGPT, be careful to not give it any sensitive information. OpenAI isn't making this very expensive model available to you for free out of the goodness of their hearts. They're using your interaction with it to [further train the model](https://help.openai.com/en/articles/6783457-chatgpt-faq).

_Update 3/21:_ There is a [good article](http://web.archive.org/web/20230318145629/https://nymag.com/intelligencer/article/ai-artificial-intelligence-chatbots-emily-m-bender.html) in the New Yorker regarding my point that ChatGPT doesn't "think." This is _contra_ Daniel Miessler's [argument](https://danielmiessler.com/blog/yes-gpts-llms-understand-argument/) that ChatGPT and similar models exhibit "understanding." 

_Update 4/4:_ And here a [good post](https://fakenous.substack.com/p/how-much-should-you-freak-out-about) by Michael Huemer on this issue.


[^1]: For a good review of the many ways in which typical adults are uninformed and mistaken about issues contra accepted expert opinion, see: B. Caplan, _The Myth of the Rational Voter: Why Democracies Choose Bad Policies_, Princeton University Press, Princeton, NJ, 2007. And B. Caplan, _The Case against Education: Why the Education System Is a Waste of Time and Money_, Princeton University Press, Princeton, NJ, 2019.