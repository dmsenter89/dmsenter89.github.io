#!/usr/bin/env python3
#
# Example: how to access PROC MI with SASPy. To accompany
#   dmsenter89.github.io/post/23-02-proc-mi-added-to-saspy
# 
# Author: Michael Senter, PhD

import saspy


# starting the SAS Session
sas = saspy.SASsession()  # loads a session using your default profile
stat = sas.sasstat()      # gives access to SAS/STAT procedures 

ods = stat.mi(data='sashelp.heart', em="outem=outem",
              var="Cholesterol Height Smoking Weight",
              procopts="simple nimpute=20 out=imp")

imputed = sas.sasdata(table="imp", libref="work")
imputed.head()


# ending the SAS session 
sas.endsas()
