

	<section>
		
			<div class="row">
				
				<div class="col-sm-7">
					<div class="blog-post-area">
						<h2 class="title text-center">Sepetteki Ürünler</h2>
						<div class="single-blog-post">
							
							<?php if ($this->session->flashdata('sonuc')) 
			  { ?>
			  <div >
                <h3><?=$this->session->flashdata('sonuc')?></h3>
                 
                
              </div>
			  
                 
                
              </div>
			  <?php } ?>	 
    
      
            <!-- /.box-header -->
            <section id="cart_items">
		<div class="container">
		
			<div class="table-responsive cart_info">
				<table class="table table-condensed">
					<thead>
						<tr class="cart_menu">
						 <th bgcolor="#ff9933">Sıra No</th>
						
                        <th bgcolor="#ff9933">Ürün Adı</th>
				        <th bgcolor="#ff9933">Miktar</th>
				        <th bgcolor="#ff9933">Birim Fiyatı</th>
				        <th bgcolor="#ff9933">Tutar</th>
				         <th bgcolor="#ff9933">Sil</th>
						</tr>
					</thead>
					<tbody>
					
					<?php
				$i=0;
				$toplam=0;
				foreach($veriler as $rs)
				{	$tutar=0;
					$tutar= $rs->urunfiyat * $rs->miktar;
					$toplam+=$tutar;
                ?>
				
				
				<tr>
                  
                  <td><?=++$i?></td>
            
                  <td><?=$rs->urunad?></td>
				  <td><?=$rs->miktar?> adet</td>
				  <td><?=$rs->urunfiyat?>₺</td>
				  <td><?=$tutar?>₺</td>
				 
				 
				 
				 <td>
                   
           
                    <a href ="<?=base_url() ?>home/sepetsil/<?=$rs->Id?>" onclick="return confirm('Silmek istediğinize emin misiniz?')" ><button type="button" class="btn btn-danger">Sil</button></a>
                    </div>
                  </td>
				  
                </tr>
				
				
				
				
				
				 <?php
				}
                ?>
					
					</tbody>
				</table>
			</div>
		</div>
	</section> <!--/#cart_items-->
              <div class="col-sm-6">
                  <form action="<?=base_url()?>home/siparis_tamamla/" method="post" >
					<div class="total_area">
					    	<H3>Genel Toplam Tutar :<H3>
						<ul>
							<li><h2><input type="text" name="tutar" readonly value="<?=$toplam?> ₺" /> </h2></li>
							
							
						</ul>
							<br>	
					</div>
				
				</div>
			  
			  <?php
			  if($i>0){ ?>
			  
				
				
			
					<div class="col-sm-6">
					<div class="total_area">
					    	<H3>KARGO ADRES BİLGİLERİ:<H3>
						<ul>
							<li>Alıcı Adı Soyadı : <input type="text" name="adsoy" value="<?=$musteri[0]->AdiSoyadi?>"  /></li>
							<li>Adresi:<input type="text" name="adres" value="<?=$musteri[0]->adres?>" /></li>
							<li>Telefonu:<input type="text" name="tel" value="<?=$musteri[0]->tel?>" /></li>
							
						</ul>
							<br>	
					</div>
					<div class="total_area">
					    <H3>ÖDEME BİLGİLERİ:<H3>	
						<ul>
							<li>Kredi Kartı No : <input type="ay" name="kartno" /></li>
							<li>SKT AY         :<input type="text" name="yıl"  /></li>
							<li>Güvenlik Kodu  : <input type="text" name="gkodu"  /></li>
								<li align="right"><button type="submit"  class="btn btn-fefault cart"> <i class="fa fa-shopping-cart"></i>Alışverişi tamamla</button><br></li>
						</ul>
							
					</div>
				</div>
						
				
					
				</form>
            <?php
			  } ?>
            <!-- /.box-body -->
          </div>
          
    

    </section>
    <!-- /.content -->

  



				
				
			
	

	

  

</body>
</html>