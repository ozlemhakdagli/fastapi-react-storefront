<br>
<br>
     
            <div class="box-header">
			<?php if($this->session->flashdata('mesaj')){?>
				<div class="callout callout-info">
				<h4>İşlem:</h4>
				<p><?=$this->session->flashdata('mesaj')?></p>
              </div>
			  </div>
				<?php } ?>
              <h2 align="center" font-weight=" bold">Ürünler Tablosu</h2><br>
			  <?php if ($this->session->flashdata('sonuc')) 
			  { ?>
			  <div class="alert alert-success alert-dismissible">
                <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>
                <i class="icon fa fa-check"></i> <?=$this->session->flashdata('sonuc')?>
                
              </div>
			  <?php } ?>
              
            </div>
            <!-- /.box-header -->
            <div class="box-body table-responsive no-padding">
              <table class="table table-hover" border="1">
			  <thead>
                <tr>
                  <th bgcolor="#99ccff">Sıra No</th>
                  <th bgcolor="#99ccff">Ürün Adı</th>
                  <th bgcolor="#99ccff">Markası</th>
				  <th bgcolor="#99ccff">Kategori</th>
				  <th bgcolor="#99ccff">Stok</th>
				  <th bgcolor="#99ccff">Kodu</th>
				  <th bgcolor="#99ccff">Satış Fiyatı</th>
				  <th bgcolor="#99ccff">Resim</th>
				  <th bgcolor="#99ccff">Galeri</th>
				  <th bgcolor="#99ccff">Durum</th>
				  <th bgcolor="#99ccff">İşlemler</th>
                </tr>
				</thead>
				<tbody>
                <?php
				$i=0;
				foreach($veriler as $rs)
				{
					
                ?>
				
				<tr>
                  <td> <?=++$i?></td>
                  <td><?=$rs->adi?></td>
                  <td><?=$rs->turadi?></td>
				
				  <td><?=$rs->katadi?></td>
				  
            
				  <td><?=$rs->stok?></td>
				  <td><?=$rs->kodu?></td>
				  <td><?=$rs->sfiyat?></td>
				 <td><?php if($rs->resim){?> 
				 <a href ="<?=base_url() ?>admin/urunler/resim_ekleme/<?=$rs->Id ?>">
				 <img src="<?=base_url()?>uploads/<?=$rs->resim?> " height="50">	</a>
				<?php }   else  {?>
				 <a href ="<?=base_url() ?>admin/urunler/resim_ekleme/<?=$rs->Id ?>" class="btn btn-block btn-default btn-x">
				 Resim Ekle</a>
				 <?php } ?>
				 </td>
				 <td align="center" ><a href="<?=base_url() ?>admin/urunler/resim_galeri_ekleme/<?=$rs->Id?>" class="fa fa-image" ></a></td>
				 <td><span class="label label-success"><?=$rs->durum?></span></td>
				 <td>
                    <div class="btn-group">
					<a href ="<?=base_url() ?>admin/urunler/edit/<?=$rs->Id ?>"><button type="button" class="btn btn-default"  >Düzenle</button></a>
                    <a href ="<?=base_url() ?>admin/urunler/preview/<?=$rs->Id ?>"> <button type="button" class="btn btn-info" data-toggle="modal" data-target="#modal-default"> Görüntüle    </button></a>
           
                    <a href ="<?=base_url() ?>admin/urunler/delete/<?=$rs->Id ?>" onclick="return confirm('Silmek istediğinize emin misiniz?')" ><button type="button" class="btn btn-danger">Sil</button></a>
                    </div>
                  </td>
				  
                </tr>
				
				
				
				
				
				 <?php
				}
                ?>
				</tbody>
                
                
              </table>
            </div>
            <!-- /.box-body -->
         
    </section>
    <!-- /.content -->
  </div>
  <!-- /.content-wrapper -->
  
