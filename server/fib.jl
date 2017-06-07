def (fib n)
  if (n == 0)
    then 0
  else if (n == 1)
    then 1
  else
    ((fib (n-1)) +
     (fib (n-2)))

def (fact n)
  if (n == 0)
    then 1
  else
    ((fact (n-1)) * n)

def ns [1,2,3,4,5]

def main
  ((print (fib 19)) >>
   (print (ns >>= (return . fact))))

