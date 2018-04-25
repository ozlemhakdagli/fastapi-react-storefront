		 <div class="">	<div class="box-header with-border">
              <h2 align="center" font-weight=" bold">Sipariş Detay</h2>
            </div> 
			<?php if ($this->session->flashdata('sonuc')) 
			  { ?>
			  <div class="alert alert-success alert-dismissible">
                <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>
                 <?=$this->session->flashdata('sonuc')?>
                
              </div>
			  <?php } ?>
            <!-- /.box-header -->
            <!-- form start -->
            <form role="form" action="<?=base_url()?>admin/siparisler/siparisguncelle/<?=$siparis[0]->Id?>" method="post">
              
				 <table class="table table-hover" align="center" border="1">
			  <thead>
                <tr>
				<th bgcolor="#99ccff">Adı Soyadı:</th>
				<td><?=$siparis[0]->adsoy?></td>
				</tr>              
                <tr>
				<th bgcolor="#99ccff">Adres:</th>
				<td><?=$siparis[0]->adres?></td>
				</tr>
                <tr>
				<th bgcolor="#99ccff">Telefon:</th>
				<td><?=$siparis[0]->tel?></td>
				</tr>
			
                <tr> 
				<th bgcolor="#99ccff">Kargo Firma</th>
				<td><input type="text"  name="kargofirma" value="<?=$siparis[0]->kargofirma?>"/></td>
				</tr>
				<tr>
				<th bgcolor="#99ccff">Kargo No:</th>
				<td><input type="text"  name="kargono" value="<?=$siparis[0]->kargono?>"/></td>
				</tr>
				<tr>
				<th bgcolor="#99ccff">Durum:</th>
               <td>                               
                  <select  name="durum">
					<option><?=$siparis[0]->durum?></option>
                    
                    <option>Onaylandı</option>
                    <option>Kargoda</option>
					<option>Tamamlandı</option>
					<option>Reddedildi</option>
					<option>İptal Edildi</option>
                    
                    
					</select>
                </td>
				</tr>
				<tr>
				<th bgcolor="#99ccff">Sipariş Notu:</th>
				<td><textarea name="adminaciklama"><?=$siparis[0]->kargono?></textarea></td>
				<br>
				</tr>
				<tr><td><button type="submit" class="btn btn-primary">Güncelle</button></td><td> <a href ="<?=base_url() ?>admin/siparisler/siparisdelete/<?=$siparis[0]->Id ?>" onclick="return confirm('Silmek istediğinize emin misiniz?')" ><button type="button" class="btn btn-danger">Sil</button></a></td>
				</tr>
				</thead>
				
                
                 
              </table><br><br>
			     
			  </form><br><br><br>
			  <h3 align="center"> Siparişe Ait Ürünler</h3>

				  <table class="table table-hover" align="center" border="1">
			  <thead>
                <tr>
                  
                  <th bgcolor="#99ccff">Sıra No</th>
                  <th bgcolor="#99ccff">Ürün Adı</th>
				  <th bgcolor="#99ccff">Miktar</th>
				  <th bgcolor="#99ccff">Birim Fiyat</th>
			      <th bgcolor="#99ccff">Tutar</th>
				 
                </tr>
				</thead>
				<tbody>
                <?php
				$i=0;
				
				foreach($urunler as $rs)
				{	
					
                ?>
				
				
				<tr>
                  
                  <td><?=++$i?></td>
                  <td><?=$rs->adi?></td>
				  <td><?=$rs->miktar?></td>
				  <td><?=$rs->fiyat?></td>
				  <td><?=$rs->tutar?></td>
				 
				 
				 
				 
				 
				  
                </tr>
				
				
				
				
				
				 <?php
				}
                ?>
				</tbody>
                
                
              </table>
				
          
				
			
              <!-- /.box-body -->

              </div>

          
            
          
 
