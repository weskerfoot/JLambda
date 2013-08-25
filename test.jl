def square
  (lambda a -> (a * a))

def pow
  (lambda base exp ->
    (base ^ exp))

def powed (pow (2 + 3 * 5) 2)

def squared (square powed)

def fact
  (lambda n ->
    if (n == 0)
      then 1
    else
      (n * (fact (n - 1))))

def fib
  (lambda n ->
    if (n == 0)
      then 0
    else
      if (n == 1)
        then 1
    else
      (+
        (fib (n - 1))
        (fib (n - 2))))

def main (print (fib 15))
