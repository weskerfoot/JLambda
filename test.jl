def (f a b)
  (a ++ b)

def (add a b)
  (a + b)

def (catstrs strs)
  (foldr f (head strs) (tail strs))

def strs ["aa", "bb"]

def (mymap f xs)
  if ((length xs) == 0)
    then
      xs
  else
    (: (f (head xs))
     (mymap f (tail xs)))

def empty []

def getFile
  (readFile "./parse.js")

def main
  if False
    then
      undefined
    else getFile
